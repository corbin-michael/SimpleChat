var app = angular.module("SimpleChat", ["firebase"]);

app.controller("SignUpCtrl", ['$scope', '$firebaseArray', function($scope, $firebaseArray) {
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
