var app = angular.module("SimpleChat", ["firebase"]);

app.controller("ChatCtrl", ['$scope', '$firebaseArray', function($scope, $firebaseArray) {
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
}]);
