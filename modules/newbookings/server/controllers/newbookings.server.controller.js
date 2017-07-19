'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Newbooking = mongoose.model('Newbooking'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Newbooking
 */
exports.create = function(req, res) {
  var newbooking = new Newbooking(req.body);
  newbooking.user = req.user;

  newbooking.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(newbooking);
    }
  });
};

/**
 * Show the current Newbooking
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var newbooking = req.newbooking ? req.newbooking.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  newbooking.isCurrentUserOwner = req.user && newbooking.user && newbooking.user._id.toString() === req.user._id.toString();

  res.jsonp(newbooking);
};

/**
 * Update a Newbooking
 */
exports.update = function(req, res) {
  var newbooking = req.newbooking;

  newbooking = _.extend(newbooking, req.body);

  newbooking.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(newbooking);
    }
  });
};

/**
 * Delete an Newbooking
 */
exports.delete = function(req, res) {
  var newbooking = req.newbooking;

  newbooking.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(newbooking);
    }
  });
};

/**
 * List of Newbookings
 */
exports.list = function(req, res) {
  Newbooking.find().sort('-created').populate('user', 'displayName').exec(function(err, newbookings) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(newbookings);
    }
  });
};

/**
 * Newbooking middleware
 */
exports.newbookingByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Newbooking is invalid'
    });
  }

  Newbooking.findById(id).populate('user', 'displayName').exec(function (err, newbooking) {
    if (err) {
      return next(err);
    } else if (!newbooking) {
      return res.status(404).send({
        message: 'No Newbooking with that identifier has been found'
      });
    }
    req.newbooking = newbooking;
    next();
  });
};