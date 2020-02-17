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
                text = "ユーザにフォローされました!";
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

        const userIDs = newValue.isRead.map(function (value) {
            return Object.keys(value)[0]
        });

        console.log(userIDs)

        // Get the list of device tokens.
        const allTokens = await admin.firestore().collection('fcmTokens').get();
        console.log(allTokens)
        var tokens = [];
        allTokens.forEach((tokenDoc) => {
            console.log(tokenDoc.id)
            tokens.push(tokenDoc.id)
        });

        console.log(tokens)

        if (tokens.length > 0) {
            // Send notifications to all tokens.
            const response = await admin.messaging().sendToDevice(tokens, payload);
            await cleanupTokens(response, tokens);
            console.log('Notifications have been sent and tokens cleaned up.');
        }
    });
