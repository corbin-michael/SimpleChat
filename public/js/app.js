var app = angular.module("SimpleChat", ["firebase", "ngRoute", "app.profile", "app.chat"]);

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

/***********************************
LOGIN CTRL
***********************************/
app.controller("LoginCtrl", ['$scope', '$location', 'currentAuth', '$route', function($scope, $location, currentAuth, $route) {

    $scope.loginUser = function() {
        firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password)
        .then(function() {
            var userName = firebase.auth().currentUser.displayName;
            $location.path('/profile');
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

/***********************************
SIGN UP CTRL
***********************************/
app.controller("SignUpCtrl", ['$scope', '$firebaseArray', '$location', 'currentAuth', '$route', function($scope, $firebaseArray, $location, currentAuth, $route) {

    // Create user function
    $scope.createUser = function() {
        var email = $scope.email;
        var password = $scope.password;

        // create a user
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function(firebaseUser){
            console.log(firebaseUser);
            // gather all the users input
            var newUserData = {
                name: $scope.name,
                username: $scope.username,
                uid: firebaseUser.uid
            }
            // DB ref to user node
            var userRef = firebase.database().ref().child("users");
            // add user to the User node with uid
            userRef.child(firebaseUser.uid).set(newUserData);

            // update firebase displayName with username
            var user = firebase.auth().currentUser;
            user.updateProfile({
                displayName: $scope.username
            }).then(function() {
                $location.path("/profile/");
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
