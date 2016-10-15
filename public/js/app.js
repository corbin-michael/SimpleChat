var app = angular.module("SimpleChat", ["firebase", "ngRoute"]);

app.config(function($routeProvider) {
    $routeProvider.
        when("/", {
            templateUrl: "templates/login.html",
            controller: "LoginCtrl"
        })
        .when("/signup", {
            templateUrl: "templates/signup.html",
            controller: "SignUpCtrl"
        })
        .when("/chat", {
            templateUrl: "templates/chat.html",
            controller: "ChatCtrl"
        })
        .otherwise("/chat", {
            templateUrl: "templates/chat.html",
            controller: "ChatCtrl"
        });
});

app.controller("LoginCtrl", ['$scope', '$firebaseArray', '$location', function($scope, $firebaseArray, $location) {
    $scope.loginUser = function() {
        firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password).then(function() {
            $location.url('/chat');
        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Error Code: " + errorCode + "Error Msg: " + errorMessage);
        });
    };
}]);

app.controller("SignUpCtrl", ['$scope', '$firebaseArray', '$location', function($scope, $firebaseArray, $location) {
    $scope.signedIn = false;

    // if user is logged in change sigendIn variable to 'true'

    // DB ref to user node
    var userRef = firebase.database().ref().child("users");

    // grab all users
    $scope.users = $firebaseArray(userRef);

    // Create user function
    $scope.createUser = function() {
        // create a user
        firebase.auth().createUserWithEmailAndPassword($scope.email, $scope.password).then(function(firebaseUser){
            console.log(firebaseUser);
            $scope.signedIn = true;
            $scope.users.$add({
                name: $scope.name,
                username: $scope.username,
                createdOn: firebase.database.ServerValue.TIMESTAMP
            });

            // on success redirect to chat area
            $location.url('/chat');

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

app.controller("ChatCtrl", ['$scope', '$firebaseArray', '$timeout', function($scope, $firebaseArray, $timeout) {
    firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log(user.uid);
  } else {
    // No user is signed in.
  }
});
    // delete timer bool
    $scope.deleteAlert = false;

    // show the remove message button
    $scope.showRemove = false;
    $scope.toggleRemove = function() {
        $scope.showRemove = $scope.showRemove === false ? true: false;
    };

    // ref to DB
    var messagesRef = firebase.database().ref().child("messages");
    // var query = messagesRef.orderByChild("timeStamp");

    // grab all messages from the database and store them in "messages"
    $scope.messages = $firebaseArray(messagesRef);

    // add message method to DB
    $scope.addMessage = function() {
        $scope.messages.$add({
            text: $scope.newMessage,
            //user: $scope.user;
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
            }, 1700);
        });
    };
}]);

app.controller("SignOutCtrl", ['$scope', '$location', function($scope, $location) {
    $scope.signOut = function() {
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            $location.url('/#')
        }, function(error) {
            // An error happened.
            console.log("Error: " + error);
        });
    };
}]);
