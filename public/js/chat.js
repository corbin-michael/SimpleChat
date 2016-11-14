var chat = angular.module("app.chat", ['firebase']);

/***********************************
CHAT CTRL
***********************************/
chat.controller("ChatCtrl", ['$scope', '$firebaseArray', '$timeout', '$location', '$route', function($scope, $firebaseArray, $timeout, $location, $route) {
    var user = firebase.auth().currentUser;
    $scope.alias = user.displayName;
    $scope.userID = user.uid;

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
