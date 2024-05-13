const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    userTo: { type: Schema.Types.ObjectId, ref: 'User'},
    userFrom: { type: Schema.Types.ObjectId, ref: 'User'},
    notificationType: { type: String },
    opened: Boolean,
    entityId: { type: Schema.Types.ObjectId}
}, {timestamps: true});

//handles the inserting of the notifications
NotificationSchema.statics.insertNotification = async (userTo, userFrom, notificationType, entityId) => {
    var data = {
        userTo : userTo,
        userFrom : userFrom,
        notificationType: notificationType,
        entityId: entityId
    }

    await Notification.deleteOne(data)
    .catch(err => console.log(err))

    return Notification.create(data)
    .catch(err => console.log(err))
}

var Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;