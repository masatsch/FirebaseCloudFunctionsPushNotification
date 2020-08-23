const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require("./credential.json");
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

exports.sendNotifications = functions.firestore.document('notifications/{notificationId}').onCreate(
    async (snapshot) => {
        // Notification details.
        const newValue = snapshot.data();

        var title = ""
        var text = ""
        switch (newValue.type) {
            case "concert":
                title = "新規ライブ";
                text = newValue.artist + "の新しいライブが追加されました!";
                break;

            case "user":
                title = "新規フォロワー";
                text = newValue.artist + "にフォローされました!";
                break;

            case "message":
                title = "新規メッセージ";
                text = newValue.artist;
                break;
            
            default:
                title = "新規通知";
                text = newValue.artist;
        }

        const payload = {
            notification: {
                title: title,
                body: text,
                content_available: 'true',
                sound: "default",
                click_action: `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
            }
        };

        console.log(process.env.GCLOUD_PROJECT);


        console.log(`users: ${newValue.users}, title: ${title}, text: ${text}`);

        newValue.users.forEach((value) => {
            admin.firestore().collection('fcmTokens').doc(value).get()
                .then((querySnapshot) => {
                    const data = querySnapshot.data()
                    admin.messaging().sendToDevice(data.fcmToken, payload);
                    return;
                }).catch(error => { console.log(`ERROR: ${error}`); return });
        });
    });
