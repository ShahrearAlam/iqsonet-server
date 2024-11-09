const mongoose = require('mongoose');
const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { CommunityModel, CommunityStatus } = require("../../models/community.model");

const createCommunity = catchAsync(async (req, res) => {
  try {
    const adminId = req.user.userId;
    const bodyData = req.body;
    const communityName = bodyData?.communityName;
    const tagline = bodyData?.tagline;
    const description = bodyData?.description;
    const communityMenu = JSON.parse(bodyData?.communityMenu);
    const profileImageURL = req.files.profilePicture[0].location;
    const coverImageURL = req.files.coverImage[0].location;

    if (!communityName || !tagline || !description || !communityMenu) {
      return apiResponse(res, httpStatus.BAD_REQUEST, { message: 'Missing required data' });
    }

    const newCommunity = new CommunityModel({
      name: communityName,
      tagline,
      description,
      profilePhoto: profileImageURL,
      coverPhoto: coverImageURL,
      topics: communityMenu,
      admin: adminId,
      members: [adminId]
    });

    await newCommunity.save();

    return apiResponse(res, httpStatus.OK, { message: 'Community created successfully' });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { message: 'Error creating the community' });
  }
});

const getAllCommunity = catchAsync(async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId)
    const communities = await CommunityModel.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          tagline: 1,
          description: 1,
          coverPhoto: 1,
          profilePhoto: 1,
          isRequestSent: {
            $cond: {
              if: {
                $in: [userId, '$requests']
              },
              then: true,
              else: false
            },
          },
          isMember: {
            $cond: {
              if: {
                $in: [userId, '$members']
              },
              then: true,
              else: false
            },
          },
          totalUser: { $size: "$members" }
        },
      },
    ]);

    return apiResponse(res, httpStatus.OK, { data: communities, message: "All communities get successfully" });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { message: 'Error fetching communities' });
  }
});

const getCommunity = catchAsync(async (req, res) => {
  try {
    const communityId = req.params.id
    const userId = new mongoose.Types.ObjectId(req.user.userId)

    const result = await CommunityModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(communityId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'admin',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          communityData: {
            name: '$name',
            isAdmin: {
              $cond: {
                if: {
                  $eq: ['$admin', userId]
                },
                then: true,
                else: false
              },
            },
            isMember: {
              $cond: {
                if: {
                  $in: [userId, '$members']
                },
                then: true,
                else: false
              },
            },
            isModerator: {
              $cond: {
                if: {
                  $in: [userId, '$moderators']
                },
                then: true,
                else: false
              },
            },
            profilePhoto: '$profilePhoto',
            tagline: '$tagline',
            coverPhoto: '$coverPhoto',
            description: '$description',
            totalUser: { $size: "$members" },
            // members: {
            //   $cond: {
            //     if: {
            //       $eq: ['$admin', userId]
            //     },
            //     then: '$members',
            //     else: {
            //       $cond: {
            //         if: {
            //           $in: [userId, '$members']
            //         },
            //         then: '$members',
            //         else: []
            //       }
            //     }
            //   }
            // },
            topics: {
              $cond: {
                if: {
                  $eq: ['$admin', userId]
                },
                then: '$topics',
                else: {
                  $cond: {
                    if: {
                      $in: [userId, '$members']
                    },
                    then: '$topics',
                    else: []
                  }
                }
              }
            },
          },
        }
      }
    ]);

    if (!result || result.length === 0) {
      return apiResponse(res, httpStatus.NOT_FOUND, { message: 'Community not found' });
    }

    return apiResponse(res, httpStatus.OK, {
      data: result[0],
      message: 'Community and User details retrieved successfully',
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { message: 'Error fetching community and user data' });
  }
});

const sendCommunityJoinRequest = catchAsync(async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const community = await CommunityModel.findById(communityId).exec();

    if (!community) {
      console.log(`No community found for ID: ${communityId}`);
      return apiResponse(res, httpStatus.NOT_FOUND, { message: 'Community not found' });
    }

    if (community.requests.includes(userId)) {
      return apiResponse(res, httpStatus.CONFLICT, { message: 'Join request already sent' });
    }

    // Add the userId to the requests array
    community.requests.push(userId);
    await community.save();

    return apiResponse(res, httpStatus.OK, {
      message: 'Join request sent successfully',
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { message: 'Error sending join request' });
  }
});

const getAllCommunityRequest = catchAsync(async (req, res) => {
  try {
    const communityId = req.params.id;
    
    const community = await CommunityModel.findOne({ _id: req.params.id });
    if (community.admin.toString() !== req.user.userId) {
      return apiResponse(res, httpStatus.FORBIDDEN, { success: false, message: 'Not authorized!' });
    }

    const result = await CommunityModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(communityId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'requests',
          foreignField: '_id',
          as: 'requestedUsers'
        }
      },
      {
        $unwind: {
          path: '$requestedUsers',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          requests: {
            $map: {
              input: [
                {
                  _id: "$requestedUsers._id",
                  fullname: "$requestedUsers.personal.fullname",
                  username: "$requestedUsers.username",
                  img: "$requestedUsers.personal.profilePicture",
                  designation: "$requestedUsers.personal.designation",
                }
              ],
              as: "reqUser",
              in: "$$reqUser"
            }
          },
        }
      },
      {
        $unwind: '$requests'
      },
      {
        $group: {
          _id: "$_id",
          requests: { $push: "$requests" },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    if (!result || result.length === 0) {
      return apiResponse(res, httpStatus.NOT_FOUND, { message: 'Requests not found' });
    }

    return apiResponse(res, httpStatus.OK, {
      data: result[0],
      total: result[0].totalRequests,
      message: 'Join Requests received successfully',
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { message: 'Error sending join request' });
  }
});

const requestCommunityAction = catchAsync(async (req, res) => {
  try {
    const { reqUserId, isAccept, isReject } = req.body;
    const community = await CommunityModel.findOne({ _id: req.params.id });

    if (!community) {
      return apiResponse(res, httpStatus.NOT_FOUND, { message: 'Community not found' });
    }

    if (community.admin.toString() !== req.user.userId) {
      return apiResponse(res, httpStatus.FORBIDDEN, { success: false, message: 'Not authorized!' });
    }

    if (isReject) {
      if (community.requests.includes(reqUserId)) {
        community.requests = community.requests.filter(id => id.toString() !== reqUserId);
        await community.save();
        return apiResponse(res, httpStatus.OK, {
          success: true,
          message: 'Request rejected successfully',
        });
      } else {
        return apiResponse(res, httpStatus.NOT_FOUND, { success: false, message: 'Request not found in community' });
      }
    }

    if (isAccept) {
      if (community.requests.includes(reqUserId)) {
        community.requests = community.requests.filter(id => id.toString() !== reqUserId);

        if (!community.members.includes(reqUserId)) {
          community.members.push(reqUserId);
        }

        await community.save();
        return apiResponse(res, httpStatus.OK, {
          success: true,
          message: 'Request accepted successfully',
        });
      } else {
        return apiResponse(res, httpStatus.NOT_FOUND, { success: false, message: 'Request not found in community' });
      }
    }

    return apiResponse(res, httpStatus.BAD_REQUEST, { success: false, message: 'Invalid request' });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { message: 'Error processing the request' });
  }
});



module.exports = {
  createCommunity,
  getAllCommunity,
  getCommunity,
  sendCommunityJoinRequest,
  getAllCommunityRequest,
  requestCommunityAction
};

