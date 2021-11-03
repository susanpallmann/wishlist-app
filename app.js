/* Authentication */

function signOut() {
    // Firebase auth sign out
    firebase.auth().signOut()
    
        // If sign-out was successful
        .then(() => {
        
            
        // If an error occured
        }).catch((error) => {
        
        
    });
}

function logIn(email, password) {
    
    // Firebase auth sign in
    firebase.auth().signInWithEmailAndPassword(email, password)
    
        // If sign in was successful
        .then((userCredential) => {
        
            // User object (not currently needed for anything)
            /* let user = userCredential.user; */

        })
    
        // If an error occured
        .catch((error) => {
        
            // Error handling from Firebase (not currently needed for anything)
            /* let errorCode = error.code; */
            /* let errorMessage = error.message; */
    });
}

/* DOM Interactions */

// If an element with DOM attribute "function" set to "signout" is clicked
$('document').on('click', '#signout', function() {
    
    // Call function signOut to handle authentication sign out
    signOut();

    // Prevent default click behavior
    event.preventDefault();
    return false;
});


// If an element with DOM attribute "function" set to "login" is clicked
$('document').on('click', '#login', function() {
    
    // Call function logIn to handle authentication log in
    logIn($('#login-email').val(), $('#login-password'));

    // Prevent default click behavior
    event.preventDefault();
    return false;
});
