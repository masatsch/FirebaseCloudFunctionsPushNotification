const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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


        console.log(newValue.users)

        newValue.users.forEach(function (value) {
            admin.firestore().collection('fcmTokens').doc(value).get()
                .then(function (querySnapshot) {
                    const data = querySnapshot.data()
                    admin.messaging().sendToDevice(data.fcmToken, payload);
                    return;
                }).catch(error => { return });
        });
    });
