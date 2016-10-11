var app = angular.module("SimpleChat", ["firebase"]);

app.controller("ChatCtrl", ['$scope', '$firebaseArray', '$timeout', function($scope, $firebaseArray, $timeout) {
    // delete timer bool
    $scope.deleteAlert = false;

    // ref to DB
    var messagesRef = firebase.database().ref().child("messages");
    // var query = messagesRef.orderByChild("timeStamp");

    // grab all messages from the database and store them in "messages"
    $scope.messages = $firebaseArray(messagesRef);

    // add message method to DB
    $scope.addMessage = function() {
        $scope.messages.$add({
            text: $scope.newMessage,
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
            }, 3000);
        });
    };
}]);
