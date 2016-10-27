var app = angular.module("SimpleChat", ["firebase", "ngRoute"]);

app.run(["$rootScope", "$location", function($rootScope, $location) {
    $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
        // We can catch the error thrown when the $requireSignIn promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
            $location.path("/");
        }
    });
}]);

app.config(function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "templates/login.html",
            controller: "LoginCtrl",
            resolve: {
              // controller will not be loaded until $waitForSignIn resolves
              // Auth refers to our $firebaseAuth wrapper in the factory below
              "currentAuth": ["Auth", function(Auth) {
                // $waitForSignIn returns a promise so the resolve waits for it to complete
                return Auth.$waitForSignIn();
              }]
            }
        })
        .when("/signup", {
            templateUrl: "templates/signup.html",
            controller: "SignUpCtrl",
            resolve: {
              // controller will not be loaded until $waitForSignIn resolves
              // Auth refers to our $firebaseAuth wrapper in the factory below
              "currentAuth": ["Auth", function(Auth) {
                // $waitForSignIn returns a promise so the resolve waits for it to complete
                return Auth.$waitForSignIn();
              }]
            }
        })
        .when("/chat", {
            templateUrl: "templates/chat.html",
            controller: "ChatCtrl",
            resolve: {
              // controller will not be loaded until $requireSignIn resolves
              // Auth refers to our $firebaseAuth wrapper in the factory below
              "currentAuth": ["Auth", function(Auth) {
                // $requireSignIn returns a promise so the resolve waits for it to complete
                // If the promise is rejected, it will throw a $stateChangeError (see above)
                return Auth.$requireSignIn();
              }]
            }
        })
        .when("/profile", {
            templateUrl: "templates/profile.html",
            controller: "ProfileCtrl",
            resolve: {
              // controller will not be loaded until $requireSignIn resolves
              // Auth refers to our $firebaseAuth wrapper in the factory below
              "currentAuth": ["Auth", function(Auth) {
                // $requireSignIn returns a promise so the resolve waits for it to complete
                // If the promise is rejected, it will throw a $stateChangeError (see above)
                return Auth.$requireSignIn();
              }]
            }
        });
});

app.factory("Auth", ["$firebaseAuth",
    function($firebaseAuth) {
        return $firebaseAuth();
    }
]);

app.controller("LoginCtrl", ['$scope', '$location', 'currentAuth', '$route', function($scope, $location, currentAuth, $route) {
    $scope.loginUser = function() {
        firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password)
        .then(function() {
            $location.path('/chat');
            $route.reload();
        }).catch(function(error) {
            // Handle Errors here.
            document.getElementById('error').innerHTML = "There was an error with the username or password you provided.";
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Error Code: " + errorCode + "Error Msg: " + errorMessage);
        });
    };

}]);

app.controller("SignUpCtrl", ['$scope', '$firebaseArray', '$location', 'currentAuth', '$route', function($scope, $firebaseArray, $location, currentAuth, $route) {

    // DB ref to user node
    var userRef = firebase.database().ref().child("users");

    // Create user function
    $scope.createUser = function() {
        // create a user
        firebase.auth().createUserWithEmailAndPassword($scope.email, $scope.password).then(function(firebaseUser){
            console.log(firebaseUser);

            var userData = {
                name: $scope.name,
                username: $scope.username,
                uid: firebaseUser.uid,
                createdOn: firebase.database.ServerValue.TIMESTAMP
            }

            // add user to the User node with uid
            userRef.child(firebaseUser.uid).set(userData);

            var user = firebase.auth().currentUser;
            user.updateProfile({
                displayName: $scope.username
            }).then(function() {
                $location.path("/chat");  // NEED TO CHANGE TO ProfileCtrl !!!!!!!!!
                $route.reload();
            }, function(error) {
                console.log("error adding: " + error);
            });

            // Clear form data
            $scope.name = "";
            $scope.username = "";
            $scope.email = "";
            $scope.password = "";
        }).catch(function(error) {
            document.getElementById('error').innerHTML = error.message;
        });
    };
}]);

app.controller("HeaderCtrl", ['$scope', '$firebaseArray', '$location', '$route', function($scope, $firebaseArray, $location, $route) {

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // get username
            $scope.alias = user.displayName;
            $scope.profilePic = user.photoURL;
            $scope.show = true;
        } else {
            // No user is signed in.
            $scope.show = false;
        }
    });

    // Sign User Out
    $scope.signOut = function() {
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            console.log("Logged out");
            $location.path('/');
            $route.reload();
        }, function(error) {
            // An error happened.
            console.log("Error: " + error);
        });
    };
}]);

app.controller("ProfileCtrl", ['$scope', '$firebaseArray', '$location', 'currentAuth', '$route', function($scope, $firebaseArray, $location, currentAuth, $route) {
    // refs for file upload
    var fileProgress = document.getElementById('fileProgress');
    var fileBtn = document.getElementById('fileBtn');
    var profileImg = document.getElementById('profileImg');
    var imgNotify = document.getElementById('imageNotify');

    // Listen for file selection
    fileBtn.addEventListener('change', function(e) {
        // get file
        var file = e.target.files[0];

        // create storage ref
        var storageRef = firebase.storage().ref('profilePics/' + file.name);

        // upload file
        var task = storageRef.put(file);

        // update progress bar
        task.on('state_changed',
            function progress(snapshot) {
                var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                fileProgress.value = percentage;
            },
            function error(err) {
                console.log("there was an error " + err);
            },
            function() {
                console.log("Done Uploading");
                var photoUrl = task.snapshot.downloadURL;
                profileImg.src = photoUrl;

                var user = firebase.auth().currentUser;
                if (user) {
                    user.updateProfile({
                        photoURL:photoUrl
                    }).then(function() {
                        imgNotify.innerHTML = "Profile Image added successfully.";
                        fileProgress.value = 0;
                        fileBtn.value = "";
                    }, function(error) {
                        imgNotify.innherHTML = error;
                    });
                } else {
                    console.log("No User");
                }
            }
        );
    });
}]);

app.controller("ChatCtrl", ['$scope', '$firebaseArray', '$timeout', '$location', 'currentAuth', '$route', function($scope, $firebaseArray, $timeout, $location, currentAuth, $route) {
    var user = firebase.auth().currentUser;
    $scope.userID = user.uid;
    $scope.imageSrc = user.photoURL;
    $scope.alias = user.displayName;

    // delete timer bool
    $scope.deleteAlert = false;

    // show the remove message button
    $scope.showRemove = false;
    $scope.editClass = 'edit';
    $scope.toggleRemove = function() {
        $scope.showRemove = $scope.showRemove === false ? true: false;
        if ( $scope.showRemove == false ) {
            $scope.editClass = 'edit';
        } else {
            $scope.editClass = 'editActive';
        }
    };

    // ref to messages in DB
    var messagesRef = firebase.database().ref().child("messages");

    // grab all messages from the database and store them in "messages"
    $scope.messages = $firebaseArray(messagesRef);

    // add message method to DB
    $scope.addMessage = function(newMessage, uid, person) {
        $scope.messages.$add({
            text: newMessage,
            userID: uid,
            username: person,
            timeStamp: firebase.database.ServerValue.TIMESTAMP
        });
        // clear message input area
        $scope.newMessage = "";
    };

    // delete message from messages/DB
    $scope.deleteMessage = function(message) {
        $scope.messages.$remove(message).then(function(messagesRef) {
            $scope.deleteAlert = true;
            $timeout(function () {
                $scope.deleteAlert = false;
            }, 1000);
        });
    };


}]);
