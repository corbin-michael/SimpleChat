var profile = angular.module("app.profile", ['firebase']);

/***********************************
PROFILE CTRL
***********************************/
profile.controller("ProfileCtrl", ['$scope', '$firebaseArray', '$location', '$route', '$routeParams', function($scope, $firebaseArray, $location, $route, $routeParams) {

    // Get current user info
    var user = firebase.auth().currentUser;
    $scope.alias = user.displayName;
    $scope.imageSrc = user.photoURL;

    // check if user has photo
    // if not don't show the <img>
    if ( user.photoURL == null ) {
        $scope.showProfileImage = false;
    } else {
        $scope.showProfileImage = true;
    }

    // check if profile image added/changed
    var profileImg = document.getElementById('profileImg');
    var userRef = firebase.database().ref('/users/' + user.uid);
    userRef.on('value', function(snapshot) {
        // set image src to image saved under user
        profileImg.src = snapshot.val().image;
        // if no image
        if ( snapshot.val().image == undefined ) {
            // don't show <img>
            $scope.showProfileImage = false;
        } else {
            // show <img>
            $scope.showProfileImage = true;
        }
    });

    // delete profile pic
    $scope.deleteProPic = function() {
        // delete from firebase user
        user.updateProfile({
            photoURL: ''
        }).then(function() {
            console.log("photoURL successfully deleted.");
        }, function(error) {
            console.log("photoURL:", error);
        });

        //delete from user ref in DB
        userRef.update({
            image: null
        });
    }

    // refs for file upload
    var fileProgress = document.getElementById('fileProgress');
    var fileBtn = document.getElementById('fileBtn');
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
                // profileImg.src = photoUrl;

                // add photoURL to Firebase Users
                var user = firebase.auth().currentUser;
                if (user) {
                    user.updateProfile({
                        photoURL:photoUrl
                    }).then(function() {
                        imgNotify.innerHTML = "Profile Image added successfully.";
                        fileProgress.value = 0;
                        fileBtn.value = "";
                        firebase.database().ref().child('users/' + user.uid).update({
                            image: photoUrl
                        });
                    }, function(error) {
                        imgNotify.innherHTML = error;
                    });
                } else {
                    console.log("No User");
                }
            }
        );
    });

    // Modals
    $scope.hideModal = true;
    $scope.modalClick = function() {
        // hideModal = the current states opposite value
        // if true then its false. if false then its true
        $scope.hideModal = !$scope.hideModal;
    }

    // Grab Users
    var usersRef = firebase.database().ref("/users");
    $scope.users = $firebaseArray(usersRef);
    $scope.currentUID = user.uid;

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
