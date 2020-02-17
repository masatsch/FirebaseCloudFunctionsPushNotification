const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.createNotification = functions.firestore
    .document('notifications')
    .onCreate((snap, context) => {
        // e.g. {'name': 'Marie', 'age': 66}
        const newValue = snap.data();

        const userIDs = newValue.isRead.map(function (value) {
            return Object.keys(value)
        });
        console.log(userIDs)

        switch (newValue.type) {
            case "concert":
                const title = "新規ライブ";
                const text = newValue.artist + "の新しいライブが追加されました!";

            case "user":
                const title = "新規フォロワー";
                const text = "ユーザにフォローされました!";
        }

        const payload = {
            notification: {
                title: title,
                body: text,
                content_available: 'true',
                sound: "default"
            }
        };

        for (uid in userIDs) {

            getTargetFcmToken(uid, function (token) {

                if (token == null) {
                    // 通知OFFのユーザーには通知を打たない
                    console.log(name, "に通知を打たない");
                    return;
                }
                console.log("fcmToken:", token);

                // tokenが欲しい
                pushToDevice(token, payload);
            });
        }
    });

// TODO: uidを使ってuserのdatabaseを検索
var getTargetFcmToken = function (uid, callback) {
    console.log("getTargetFcmToken:");

    const rootRef = teamRef.parent.parent;
    const userRef = rootRef.child("users").child(uid);

    userRef.once('value').then(function (snapshot) {
        const isOn = snapshot.val().commentPush;
        console.log("isOn:", isOn);

        if (isOn == false) {
            // 通知設定がOFFの場合
            console.log("return callback null");
            callback(null);
            return
        }
        const fcmToken = snapshot.val().fcmToken

        console.log("return callback fcmToken", fcmToken);
        callback(fcmToken);
    });
}


function pushToDevice(token, payload) {
    console.log("pushToDevice:", token);

    // priorityをhighにしとくと通知打つのが早くなる
    const options = {
        priority: "high",
    };

    admin.messaging().sendToDevice(token, payload, options)
        .then(pushResponse => {
            console.log("Successfully sent message:", pushResponse);
        })
        .catch(error => {
            console.log("Error sending message:", error);
        });
}