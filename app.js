import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.9.1/firebase-auth.min.js";

import {
  setDoc,
  doc,
  getFirestore,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  updateDoc
} from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.9.1/firebase-firestore.min.js";

import { getStorage, ref, getDownloadURL, uploadString } from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.9.1/firebase-storage.min.js";

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

const email = document.querySelector("#signup_email");
const dp = document.querySelector("#signup_dp");
const name = document.querySelector("#signup_fullname");
const password = document.querySelector("#signup_password");

let USER, TWEETS,PHOTO;

const updateUIElements = () => {
  document.querySelector(".form").style.display = "block";
  document.querySelector(".sidebar").style.display = "block";
  document.querySelector(".signup-btn").style.display = "none";
  document.querySelector(".login-btn").style.display = "none";
  document.querySelector(".signout-btn").style.display = "block";
  document.querySelectorAll(".dp_image").forEach((img) => {
    img.src = USER.photo;
  });
  document.querySelector("#account_fullname").innerHTML = USER.name;
  document.querySelector("#account_username").innerHTML = `@${USER.name}`;
};

document.querySelector(".signout-btn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      // Sign-out successful.
      document.querySelector(".form").style.display = "none";
      document.querySelector(".sidebar").style.display = "none";
    })
    .catch((error) => {
      // An error happened.
      alert(error.message);
    });
});

const getUserData = async (email) => {
  const userRef = doc(db, "users", email);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    USER = docSnap.data();
    updateUIElements();
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    getUserData(user.email);
  } else {
    console.log("no user");
    document.querySelector(".signup-btn").style.display = "flex";
    document.querySelector(".login-btn").style.display = "flex";
    document.querySelector(".signout-btn").style.display = "none";
    // document.querySelector(".sign").style.display = "none";
    // User is signed out
  }
});

const signUp = async () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(async (userCredential) => {
      let newUser = {
        name: name.value,
        password: password.value,
        email: email.value,
        photo: dp.value,
      };
      const userRef = await setDoc(doc(db, "users", email.value), newUser).then(
        () => {
          USER = newUser;
        }
      );
      // Signed in
      const user_ = userCredential.user;
      alert("successful");
      email.value = "";
      name.value = "";
      dp.value = "";
      password.value = "";
      document.querySelector("#hideModal").click();
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
      alert(errorMessage);
      console.error(error);
    });
};

const loginUser = async () => {
  let login_email = document.getElementById("login_email").value;
  let login_password = document.getElementById("login_password").value;
  signInWithEmailAndPassword(auth, login_email, login_password)
    .then(async () => {
      getUserData(login_email);
      document.querySelector("#hideloginModal").click();
      login_email = "";
      login_password = "";
    })
    .catch((err) => {
      alert(err.message);
      console.log(err);
    });
};

// authentication
document.querySelector("#signUp_form").addEventListener("submit", (e) => {
  e.preventDefault();
  signUp();
});
// login
document.querySelector(".login_form").addEventListener("submit", (e) => {
  e.preventDefault();
  loginUser();
});

// upadate tweets container
const updateTweetContainer = () => {
  let container = document.querySelector(".tweets_div");
  let HTMLContent = "";
  container.innerHTML = "";
  TWEETS.forEach((tweet) => {
    let timePosted = moment(new Date(tweet.postedAt), "YYYYMMDD").fromNow(); // 11 years ago
    HTMLContent += `<div class="tweets_container" id="tweets_container">
  <div class="tweet">
    <img src="${tweet.dp}" alt="" class='tweet_dp' />
    <div class="tweet_body">
      <div class="tweet_header">
        <h5 id="fullname">${tweet.name}</h5>
        <p id="username">@${tweet.name.toLowerCase()}</p>
        <p id="postedAt">
         ${timePosted}
        !</p>
        <i class="bi bi-three-dots"></i>
      </div>
      <div class="tweet_text" id="tweet_text">${tweet.caption}</div>
      <img
        class="image"
        id="tweet_image"
        src="${tweet.photo}"
        alt="image"
      />
    </div>
  </div>
</div>`;
  });

  container.innerHTML = HTMLContent;
};

// get tweets
const q = query(collection(db, "tweets"), orderBy("postedAt", "desc"));
const unsubscribe = onSnapshot(q, (querySnapshot) => {
  const tweet_data = [];
  querySnapshot.forEach((doc) => {
    tweet_data.push(doc.data());
  });
  TWEETS = tweet_data;
  console.log(TWEETS);
  updateTweetContainer();
  console.log(
    new TimeAgo("en-US").format(
      new Date("Fri Jul 29 2022 13:48:36 GMT-0700 (Pacific Daylight Time)")
    )
  );
});

// create new tweet
document.querySelector(".form").addEventListener("submit", async (e) => {
  e.preventDefault();
  let tweetID = uuidv4();
  let caption = document.getElementById("caption");
  let newTweet = {
    name: USER.name,
    dp: USER.photo,
    photo: "",
    postedAt: Date.now(),
    caption: caption.value
  };
  const tweetRef = await setDoc(doc(db, "tweets", tweetID), newTweet).then(async() => {
    e.target.value = '';
    let url;
      if (filePicker.files[0]) {
        // upload photo
        const imageRef = ref(storage, `images/photo${uuidv4()}`);
        await uploadString(imageRef, PHOTO, "data_url")
          .then(async (snapshot) => {
            const downloadURL = await getDownloadURL(imageRef);
            url = downloadURL;
          })
          .then(async () => {
            const docRef = doc(db, "tweets", tweetID);
            await updateDoc(docRef,{
              photo: url
            })            
            alert("Successfull Added");
          });
      }
  });
});

const filePicker = document.querySelector("#filePicker")
filePicker.addEventListener('change', (e)=>{
  const reader = new FileReader();
  if (e.target.files[0]) {
    reader.readAsDataURL(e.target.files[0]);
  }

  reader.onload = (readerEvent) => {
    PHOTO = readerEvent.target.result;
  };
})
document.querySelector(".bi-image").addEventListener("click", ()=>{
  filePicker.click()
  console.log(filePicker.files[0])
})


