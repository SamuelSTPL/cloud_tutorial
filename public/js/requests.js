var app = new Vue({
  el: "#app",
  data: {
    requests: [],
  },
  methods: {
    upvoteRequest(id) {
      const upvote = firebase.functions().httpsCallable("upvote");
      upvote({ id }).catch((err) => {
        showNotification(err.message);
      });
    },
  },
  mounted() {
    const ref = firebase
      .firestore()
      .collection("requests")
      .orderBy("upvotes", "desc");
    // Fire everytime a data change happens in the collection
    // Used to keep the FE up to date with the Firestore DB
    ref.onSnapshot((snapshot) => {
      let requests = [];
      snapshot.forEach((doc) => {
        requests.push({ ...doc.data(), id: doc.id });
      });
      this.requests = requests;
    });
  },
});
