import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriberId = req.user.id;

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });
  if (existingSubscription) {
    await Subscription.deleteOne({
      _id: existingSubscription._id,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Unsubscribed from the channel successfully")
      );
  } else {
    const subscribed = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribed,
          "Subscribed to the channel successfully"
        )
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: "$subscriberDetails._id",
        username: "$subscriberDetails.username",
        email: "$subscriberDetails.email",
      },
    },
  ]);

  if (!subscriber || subscriber.length === 0) {
    throw new ApiError(404, "No subscribers found for this channel");
  }

  return res
    .status(200)
    .json(new ApiResponse(205, subscriber, "Subscribers fetched successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscripedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannelDetails",
      },
    },
    {
      $unwind: "$subscribedChannelDetails",
    },
    {
      $project: {
        _id: "$subscribedChannelDetails._id",
        username: "$subscribedChannelDetails.username",
        email: "$subscribedChannelDetails.email",
        avatar: "$subscribedChannelDetails.avatar",
      },
    },
  ]);

  if (!subscripedChannels || subscripedChannels.length === 0) {
    throw new ApiError(404, "No channel subscribed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        205,
        subscripedChannels,
        "Subscribers fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
