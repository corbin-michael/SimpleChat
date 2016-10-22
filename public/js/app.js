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

            // add user to the User node with uid
            userRef.child(firebaseUser.uid).set({
                name: $scope.name,
                username: $scope.username,
                uid: firebaseUser.uid,
                createdOn: firebase.database.ServerValue.TIMESTAMP
            });

            $location.path("/chat");  // NEED TO CHANGE TO ProfileCtrl !!!!!!!!!
            $route.reload();

            // Clear form data
            $scope.name = "";
            $scope.username = "";
            $scope.email = "";
            $scope.password = "";
        }).catch(function(error) {
            console.log("Error: " + error);
            // $scope.errorCode = error.code;
            // $scope.errorMessage = error.message;
        });
    };
}]);

app.controller("HeaderCtrl", ['$scope', '$firebaseArray', '$location', '$route', function($scope, $firebaseArray, $location, $route) {

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // get username
            firebase.database().ref().child('users/' + user.uid).once("value").then(function(snapshot){
                $scope.alias = snapshot.val().username;
            });
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

}]);

app.controller("ChatCtrl", ['$scope', '$firebaseArray', '$timeout', '$location', 'currentAuth', '$route', function($scope, $firebaseArray, $timeout, $location, currentAuth, $route) {

    var currentUser = firebase.auth().currentUser;
    $scope.userID = currentUser.uid;

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
