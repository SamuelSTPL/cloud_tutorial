/* eslint-disable max-len */
/* eslint-disable indent */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// auth trigger (new user signup)
exports.newUserSignUp = functions.auth.user().onCreate((user) => {
  // for background triggers you must return a value/promise
  return admin.firestore().collection("users").doc(user.uid).set({
    email: user.email,
    upvotedOn: [],
  });
});

// auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete((user) => {
  const doc = admin.firestore().collection("users").doc(user.uid);
  return doc.delete();
});

// http callable function (adding a request)
exports.addRequest = functions.https.onCall((data, context) => {
  // Access the context argument to check if the user is Logged In
  if (!context.auth) {
    // HTTPError first argument must be a given error code given by Firebase then the error message itself
    throw new functions.https.HttpsError(
      "unauthenticated",
      "only authenticated users can add requests"
    );
  }
  // Access the data argument to get the text entered by the user
  if (data.text.length > 30) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "request must be no more than 30 characters long"
    );
  }
  // Create document in the targeted collection if the conditions pass
  return admin.firestore().collection("requests").add({
    text: data.text,
    upvotes: 0,
  });
});

// Upvote function
exports.upvote = functions.https.onCall((data, context) => {
  // Check if user is logged in (auth state)
  if (!context.auth) {
    // HTTPError first argument must be a given error code given by Firebase then the error message itself
    throw new functions.https.HttpsError(
      "unauthenticated",
      "only authenticated users can vote up requests"
    );
  }
  // Get refs from both collections (user & request)
  const user = admin.firestore().collection("users").doc(context.auth.uid);
  const request = admin.firestore().collection("requests").doc(data.id);

  return user.get().then((doc) => {
    // Check if user hasn't already upvoted the request
    if (doc.data().upvotedOn.includes(data.id)) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "You can only vote something up once"
      );
    }

    // update the array in user document
    return user
      .update({
        upvotedOn: [...doc.data().upvotedOn, data.id],
      })
      .then(() => {
        // Update number of vote on the requestonly authenticated users can add requests
        return request.update({
          upvotes: admin.firestore.FieldValue.increment(1),
        });
      });
  });
});

// Firestore trigger for tracking activity
exports.logActivities = functions.firestore
  .document("/{collection}/{id}")
  .onCreate((snap, context) => {
    console.log(snap.data());
    const collection = context.params.collection;
    // const id = context.params.id;

    const activities = admin.firestore().collection("activities");

    if (collection === "request") {
      // eslint-disable-next-line object-curly-spacing
      return activities.add({ text: "a new recipe request was added" });
    }
    if (collection === "users") {
      // eslint-disable-next-line object-curly-spacing
      return activities.add({ text: "a new users signed up" });
    }

    return null;
  });
