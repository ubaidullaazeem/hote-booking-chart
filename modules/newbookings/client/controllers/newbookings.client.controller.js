(function() {
  'use strict';

  // Newbookings controller
  angular
    .module('newbookings')
    .controller('NewbookingsController', NewbookingsController);

  NewbookingsController.$inject = ['AuthenticationService', 'CGST', 'SGST', 'DATA_BACKGROUND_COLOR', 'EmailBookingServices', 'HARDCODE_VALUES', 'PAYMENT_STATUS', '$filter', '$scope', '$state', 'selectedEvent', '$location', '$mdDialog', '$templateRequest', '$sce', 'NewbookingsService', 'selectedDate', 'HallsService', 'EventtypesService', 'TaxesService', 'PaymentstatusesService', 'Notification', '$mdpTimePicker', '$mdpDatePicker', 'PAY_MODES', 'CommonService', 'ValidateOverlapBookingServices', 'viewMode'];

  function NewbookingsController(AuthenticationService, CGST, SGST, DATA_BACKGROUND_COLOR, EmailBookingServices, HARDCODE_VALUES, PAYMENT_STATUS, $filter, $scope, $state, selectedEvent, $location, $mdDialog, $templateRequest, $sce, NewbookingsService, selectedDate, HallsService, EventtypesService, TaxesService, PaymentstatusesService, Notification, $mdpTimePicker, $mdpDatePicker, PAY_MODES, CommonService, ValidateOverlapBookingServices, viewMode) {
    $scope.DATA_BACKGROUND_COLOR = DATA_BACKGROUND_COLOR;

    var totalCostToDiscountProrate = 0;

    $scope.ui = {
      mSelectedDateToDisplay: selectedDate.format('DD-MMMM-YYYY'),
      mNumberPattern: /^[0-9]*$/,
      mEmailPattern: /^.+@.+\..+$/,
      createMode: true,
      showMdSelect: true,
      mailsending: false,
      viewMode: viewMode,
      isPastEvent: selectedEvent ? moment(selectedEvent.mStartDateTime) < moment(new Date().setHours(0, 0, 0, 0)) : true
    }

    $scope.model = {
      halls: HallsService.query(),
      eventTypes: EventtypesService.query(),
      paymentStatuses: PaymentstatusesService.query(),
      taxes: TaxesService.query(),
      paymentModes: PAY_MODES
    };

    $scope.mPaymentHistory = {
      amountPaid: null,
      paidDate: new Date(),
      paymentMode: null,
      CGSTPercent: 0,
      SGSTPercent: 0
    };

    $scope.taxableChargesBeforeDiscount = 0;

    $scope.mixins = {
      _id: selectedEvent ? selectedEvent._id : undefined,
      mSelectedHalls: selectedEvent ? selectedEvent.mSelectedHalls : [],
      mSelectedEventType: selectedEvent ? selectedEvent.mSelectedEventType : null,
      mOtherEvent: selectedEvent ? selectedEvent.mOtherEvent : null,
      mDescription: selectedEvent ? selectedEvent.mDescription : null,
      mName: selectedEvent ? selectedEvent.mName : null,
      mPhone: selectedEvent ? selectedEvent.mPhone : null,
      mEmail: selectedEvent ? selectedEvent.mEmail : null,
      mAddress: selectedEvent ? selectedEvent.mAddress : null,
      mPhotoId: selectedEvent ? selectedEvent.mPhotoId : null,
      mSelectedPaymentStatus: selectedEvent ? selectedEvent.mSelectedPaymentStatus : null,
      mManagerName: selectedEvent ? selectedEvent.mManagerName : null,
      mDiscount: selectedEvent ? selectedEvent.mDiscount : 0,
      mSubTotal: selectedEvent ? selectedEvent.mSubTotal : 0,
      mCGST: selectedEvent ? selectedEvent.mCGST : 0,
      mSGST: selectedEvent ? selectedEvent.mSGST : 0,
      mGrandTotal: selectedEvent ? selectedEvent.mGrandTotal : 0,
      mPaymentHistories: selectedEvent ? selectedEvent.mPaymentHistories : [],
      mBalanceDue: selectedEvent ? selectedEvent.mBalanceDue : 0
    };

    $scope.eventTime = {
      mStartClock: new Date('1991-05-04T06:00:00'),
      mEndClock: new Date('1991-05-04T13:00:00'),
      mStartToDisplay: selectedEvent ? getTimeToDisplay(new Date(selectedEvent.mStartDateTime)) : getTimeToDisplay(new Date('1991-05-04T06:00:00')),
      mEndToDisplay: selectedEvent ? getTimeToDisplay(new Date(selectedEvent.mEndDateTime)) : getTimeToDisplay(new Date('1991-05-04T13:00:00')),
      mStartToServer: getTimeToServer(new Date('1991-05-04T06:00:00')),
      mEndToServer: getTimeToServer(new Date('1991-05-04T13:00:00'))
    };

    $scope.$watch('mixins.mSelectedHalls', function(newValue) {
      calculateHallsRate();
      $scope.calculateBalanceDue();
    }, true);

    // Fetch the Terms and conditions
    var templateUrl = $sce.getTrustedResourceUrl('/modules/newbookings/client/views/templates/newbookings-terms-and-conditions.html');

    $templateRequest(templateUrl).then(function(template) {
      $scope.termsAndConditions = template;
    });

    $scope.selectedHallsChanged = function() {
      $scope.mixins.mSelectedHalls = _.uniqBy($scope.mixins.mSelectedHalls, '_id');

      angular.forEach($scope.mixins.mSelectedHalls, function(hall) {
        /** Ubai New Code Start **/
        var selectedHalls = [];
        if (selectedEvent) {
          selectedHalls = _.filter(selectedEvent.mSelectedHalls, function(mSelectedHall) {
            return mSelectedHall.name === hall.name;
          });
        }
        /** End **/
        var effectiveSummaries = CommonService.findRateSummariesByDate(hall.rateSummaries, new Date(selectedDate));
        if (effectiveSummaries.length > 0) {
          /** Ubai New Code Start **/
          hall.mBasicCost = selectedHalls.length > 0 ? selectedHalls[0].mBasicCost : effectiveSummaries[0].rate,
            hall.mElectricityCharges = selectedHalls.length > 0 ? selectedHalls[0].mElectricityCharges : effectiveSummaries[0].powerConsumpationCharges,
            hall.mActualElectricityCharges = selectedHalls.length > 0 ? selectedHalls[0].mActualElectricityCharges : 0,
            hall.mDamages = selectedHalls.length > 0 ? selectedHalls[0].mDamages : 0,
            hall.mCleaningCharges = selectedHalls.length > 0 ? selectedHalls[0].mCleaningCharges : effectiveSummaries[0].cleaningCharges,
            hall.mGeneratorCharges = selectedHalls.length > 0 ? selectedHalls[0].mGeneratorCharges : 0,
            hall.mMiscellaneousCharges = selectedHalls.length > 0 ? selectedHalls[0].mMiscellaneousCharges : 0
            /** End **/
          if (selectedHalls.length > 0 && selectedHalls[0].mCalendarId && selectedHalls[0].mEventId) {
            hall.mCalendarId = selectedHalls[0].mCalendarId;
            hall.mEventId = selectedHalls[0].mEventId;
          }
        } else {
          Notification.error({
            message: "Effective date is not found for " + hall.name,
            title: '<i class="glyphicon glyphicon-remove"></i> Effective date Error !!!'
          });
          $mdDialog.cancel();
        }
      });

      calculateHallsRate();
      $scope.calculateBalanceDue();
    };

    $scope.getOtherEvents = function() {
      var events = _.filter($scope.model.eventTypes, function(eventType) {
        return eventType.name === HARDCODE_VALUES[0];
      });
      return events[0];
    };

    $scope.showStartTimePicker = function(ev) {
      $mdpTimePicker($scope.eventTime.mStartClock, {
          targetEvent: ev
        })
        .then(function(dateTime) {
          $scope.eventTime.mStartClock = dateTime;
          $scope.eventTime.mStartToDisplay = getTimeToDisplay(dateTime);
          $scope.eventTime.mStartToServer = getTimeToServer(dateTime);

          validateStartAndEndTime();
        });
    };

    $scope.showEndTimePicker = function(ev) {
      $mdpTimePicker($scope.eventTime.mEndClock, {
          targetEvent: ev
        })
        .then(function(dateTime) {
          $scope.eventTime.mEndClock = dateTime;
          $scope.eventTime.mEndToDisplay = getTimeToDisplay(dateTime);
          $scope.eventTime.mEndToServer = getTimeToServer(dateTime);

          validateStartAndEndTime();
        });
    };

    $scope.showPaidDatePicker = function(ev) {
      var dateToPicker = $scope.mPaymentHistory.paidDate ? new Date($scope.mPaymentHistory.paidDate) : new Date();

      $mdpDatePicker(dateToPicker, {
        targetEvent: ev
      }).then(function(date) {
        $scope.mPaymentHistory.paidDate = new Date(date);
      });
    };

    $scope.printBooking = function(form) {
      if (form.$valid) {
        printElement(document.getElementById("printThis"));
        var printContents = document.getElementById("printSection").innerHTML;
        var popupWin = window.open('', '_blank', 'width=300,height=300');
        popupWin.document.open();
        popupWin.document.write(getNewBookingData(form));
        popupWin.document.close();
      }
    }

    function printElement(elem) {
      var domClone = elem.cloneNode(true);
      var $printSection = document.getElementById("printSection");

      if (!$printSection) {
        var $printSection = document.createElement("div");
        $printSection.id = "printSection";
        $($printSection).hide();
        document.body.appendChild($printSection);
      }

      $printSection.innerHTML = "";
      $printSection.appendChild(domClone);
    }

    function getNewBookingData(form) {
      var baseUrl = $location.$$absUrl.replace($location.$$url, '');
      var halls = CommonService.makeFirstLetterCapitalizeinArray(_.map($scope.mixins.mSelectedHalls, 'name'));

      return '<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()"><html><head> <title>Mirth</title></head><body><html><head> <title>Mirth</title></head><body><div style="border-style: solid; padding: 10px;"><div align="center"><div align="center"><img src="' + baseUrl + '/modules/core/client/img/logo-bw.png" /></div><h2 align="center"><u>BOOKING DETAILS</u></h2><table style="width: 100%;" align="center"> <tbody> <tr> <td style="width: 50%;"> Name </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mName) + ' </td> </tr> <tr> <td style="width: 50%;"> Address </td> <td style="width: 50%;">: ' + getValidValue($scope.mixins.mAddress) + ' </td> </tr> <tr> <td style="width: 50%;"> Phone No./Mobile No. </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mPhone) + '</td> </tr> <tr> <td style="width: 50%;"> Email I.D </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mEmail) + '</td> </tr> <tr> <td style="width: 50%;"> Photo ID of the Person </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mPhotoId) + '</td> </tr> <tr> <td style="width: 50%;"> Purpose of which Auditorium required </td> <td style="width: 50%;"> : ' + getValidValue(halls) + ' </td> </tr> <tr> <td style="width: 50%;"> Date/Time of Function </td> <td style="width: 50%;"> : ' + getValidValue(getEventDateTime()) + ' </td> </tr> <tr> <td style="width: 50%;"> Mode of Payment Cheque/DD/Cash/NEFT </td> <td style="width: 50%;">  : ' + getValidValue($scope.mPaymentHistory.paymentMode) + '</td> </tr> <tr> <td style="width: 50%;"> Halls </td> <td style="width: 50%;"> : ' + getValidValue(halls) + '</td> </tr> <tr> <td style="width: 50%;"> Description </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mDescription) + ' </td> </tr></tbody></table><h2 align="center"><u>DETAILS OF CHARGES</u></h2><table style="width: 100%;" align="center"> <tbody> <tr> <td style="width: 100%;" colspan="2"> <u>Service Code 997212:</u> </td> </tr> <tr> <td style="width: 50%;"> Rent(Ruby, Opal) + Electricity/Cleaning/Generator/Miscellaneous charges </td> <td style="width: 50%;"> : ' + $scope.mixins.mSubTotal + ' </td> </tr> <tr> <td style="width: 50%;"> CGST @ 9% </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mCGST) + ' </td> </tr> <tr> <td style="width: 50%;"> SGST @ 9% </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mSGST) + '</td> </tr> <tr> <td style="width: 50%;"> Grand Total </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mGrandTotal) + '</td> </tr> <tr> <td style="width: 50%;"> Advance Received </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mBasicCost) + '</td> </tr> <tr> <td style="width: 50%;"> Balance Due </td> <td style="width: 50%;"> : ' + getValidValue($scope.mixins.mBalanceDue) + '</td> </tr> </tbody></table><p style="text-align:left">Note:- The entry to the hall will be permitted to the Service Providers &Guests only after the receipt of the entire payment.</p><br/><br/><br/><br/><table style="width:100%"><tbody><tr><td style="width: 33%; text-align: left">Signature of the Manager</td><td style="width: 67%; text-align: right"> Signature of the Guest</td></tr></tbody></table></div><br/><br/><br/>' + $scope.termsAndConditions + '</div></body></html></body></html></body></html>';
    }

    function getEventDateTime() {
      return $scope.ui.mSelectedDateToDisplay + ' ' + $scope.eventTime.mStartToDisplay + ' - ' + $scope.eventTime.mEndToDisplay;
    }

    // function getTotalCharges() {
    //   return $scope.mixins.mBasicCost + $scope.mixins.mElectricityCharges + $scope.mixins.mCleaningCharges + $scope.mixins.mGeneratorCharges + $scope.mixins.mMiscellaneousCharges;
    // }

    function getValidValue(data) {
      return (data !== null && data !== undefined) ? data : '--';
    }

    $scope.sendMail = function(form) {
      if (form.$valid && $scope.mixins.mEmail) {
        $scope.ui.mailsending = true;
        var emailContent = {
          content: getNewBookingData(),
          newBooking: $scope.mixins,
          totalCharges: $scope.mixins.mSubTotal,
          halls: CommonService.makeFirstLetterCapitalizeinArray(_.map($scope.mixins.mSelectedHalls, 'name')),
          paymentMode: $scope.mPaymentHistory.paymentMode,
          eventDateTime: getEventDateTime(),
          subject: "Mirth Hall Booking Details"
        };

        if ($scope.mixins.mEmail === null) {
          Notification.error({
            message: "Mail not sent",
            title: '<i class="glyphicon glyphicon-remove"></i> Email Id Missing Error !!!'
          });
        } else {
          EmailBookingServices.requestSendEmail(emailContent)
            .then(onRequestEmailBookingSuccess)
            .catch(onRequestEmailBookingError);
        }
      }
    };

    function onRequestEmailBookingSuccess(response) {
      $scope.ui.mailsending = false;
      Notification.success({
        message: response.message,
        title: '<i class="glyphicon glyphicon-remove"></i> Email drop successfully !!!'
      });
    }

    function onRequestEmailBookingError(response) {
      $scope.ui.mailsending = false;
      Notification.error({
        message: response.message,
        title: '<i class="glyphicon glyphicon-remove"></i> Email failed to snet !!!'
      });
    }

    function validateStartAndEndTime() {
      if ($scope.bookingForm) {
        var bool = (Date.parse($scope.eventTime.mEndToServer) > Date.parse($scope.eventTime.mStartToServer));
        $scope.bookingForm.end.$setValidity("greater", bool);
        $scope.bookingForm.start.$setValidity("lesser", bool);
      }
    };

    function getTimeToDisplay(date) {
      return moment(date).format('hh:mm:a');
    };

    function getTimeToServer(date) {
      var dt = (new Date(selectedDate)).setHours(date.getHours(), date.getMinutes(), 0, 0);
      var dtGMT = new Date((new Date(dt)).toUTCString()).toISOString();

      return dtGMT;
    };

    //var divideRate;
    var cgstPercent, sgstPercent;

    $scope.calculateBalanceDue = function() {

      var subTotal = $scope.taxableChargesBeforeDiscount - Number($scope.mixins.mDiscount);

      var cgst = Number(Number(Number(subTotal) * cgstPercent).toFixed(2));
      var sgst = Number(Number(Number(subTotal) * sgstPercent).toFixed(2));
      var grandTot = Number(Number(Math.round(Number(subTotal) + Number(cgst) + Number(sgst))).toFixed(2));
      var receivedPayment = CommonService.sumOfArray(_.map($scope.mixins.mPaymentHistories, 'amountPaid'));
      var balance = Number(Number(Math.round(Number(grandTot) - Number($scope.mPaymentHistory.amountPaid))).toFixed(2));

      $scope.mixins.mSubTotal = subTotal;
      $scope.mixins.mCGST = cgst;
      $scope.mixins.mSGST = sgst;
      $scope.mixins.mGrandTotal = grandTot;
      $scope.mixins.mBalanceDue = $scope.ui.createMode ? balance : balance - receivedPayment;

      console.log("$scope.mSubTotal " + $scope.mixins.mSubTotal);
      console.log("$scope.mCGST " + $scope.mixins.mCGST);
      console.log("$scope.mSGST " + $scope.mixins.mSGST);
      console.log("$scope.mGrandTotal " + $scope.mixins.mGrandTotal);
      console.log("$scope.mBalanceDue " + $scope.mixins.mBalanceDue);
    };

    var init = function() {
      if ($scope.mixins._id) {
        $scope.ui.createMode = false;
        $scope.ui.showMdSelect = false;
      };
      $scope.disabledSelectedHalls = CommonService.makeFirstLetterCapitalizeinArray(_.map($scope.mixins.mSelectedHalls, 'name'));
      var hasContainsTaxName = CommonService.hasContainsTaxName($scope.model.taxes);
      if (!hasContainsTaxName) {
        Notification.error({
          message: "Please add both CGST and SGST tax rate.",
          title: '<i class="glyphicon glyphicon-remove"></i> Tax Missing Error !!!'
        });
        $mdDialog.cancel();
      } else {
        var cgst = CommonService.findRateSummariesByDate(CommonService.getTaxRateByName($scope.model.taxes, CGST).rateSummaries, new Date(selectedDate));
        var sgst = CommonService.findRateSummariesByDate(CommonService.getTaxRateByName($scope.model.taxes, SGST).rateSummaries, new Date(selectedDate));

        $scope.mPaymentHistory.CGSTPercent = cgst[0].percentage;
        $scope.mPaymentHistory.SGSTPercent = sgst[0].percentage;

        cgstPercent = Number(cgst[0].percentage) / 100;
        sgstPercent = Number(sgst[0].percentage) / 100;
      }

      $scope.calculateBalanceDue();

    };

    $scope.model.taxes.$promise.then(function(result) {
      init();
    });

    // Save Newbooking
    $scope.save = function(form) {

      if (form.$valid) {
        if (($scope.mixins.mSelectedPaymentStatus.name.toLowerCase() == PAYMENT_STATUS[1] && $scope.mixins.mBalanceDue !== 0) || $scope.mixins.mSelectedPaymentStatus.name.toLowerCase() == PAYMENT_STATUS[0] && $scope.mixins.mBalanceDue <= 0) {
          Notification.error({
            message: "Please check the payment status and payment received",
            title: '<i class="glyphicon glyphicon-remove"></i> Payment Status Error !!!'
          });

          return;
        }

        if ($scope.mixins.mBalanceDue < 0) {
          Notification.error({
            message: "Please enter valid data.",
            title: '<i class="glyphicon glyphicon-remove"></i> Error !!!'
          });

          return;
        }

        $scope.mixins.mStartDateTime = $scope.eventTime.mStartToServer;
        $scope.mixins.mEndDateTime = $scope.eventTime.mEndToServer;
        $scope.mixins.date = new Date($scope.eventTime.mStartToServer).getDate();
        $scope.mixins.month = new Date($scope.eventTime.mStartToServer).getMonth() + 1;
        $scope.mixins.year = new Date($scope.eventTime.mStartToServer).getFullYear();

        if ($scope.ui.createMode) {
          $scope.mixins.mPaymentHistories.push($scope.mPaymentHistory);
        } else {
          pushPayment();
        }

        // Calculate Prorate Charges
        calculateProrateCharges();

        $scope.mixins.mSelectedHalls = _.uniqBy($scope.mixins.mSelectedHalls, '_id');

        var startOfTheDayInLocal = new Date(selectedDate);
        startOfTheDayInLocal.setHours(0, 0, 0, 0);
        var endOfTheDayInLocal = new Date(selectedDate);
        endOfTheDayInLocal.setHours(23, 59, 59, 999);
        var gmtDateTime = {
          startGMT: new Date(startOfTheDayInLocal.toUTCString()).toISOString(),
          endGMT: new Date(endOfTheDayInLocal.toUTCString()).toISOString()
        };

        ValidateOverlapBookingServices.requestvalidateoverlap(gmtDateTime).then(function(eventsOfTheDay) {

          if (!$scope.ui.createMode) {
            eventsOfTheDay = _.reject(eventsOfTheDay, function(hallonday) {
              return hallonday._id === $scope.mixins._id;
            });
          }

          var isEventOverlaps = false;
          for (var i = 0; i < eventsOfTheDay.length; i++) {
            var eventItem = eventsOfTheDay[i];

            var commonHallIdsArray = _.intersection(_.map(eventItem.mSelectedHalls, '_id'), _.map($scope.mixins.mSelectedHalls, '_id'));
            var commonHallNamesArray = _.intersection(_.map(eventItem.mSelectedHalls, 'name'), _.map($scope.mixins.mSelectedHalls, 'name'));

            if (commonHallIdsArray.length > 0) {
              //already booked hall selected
              if (($scope.eventTime.mStartToServer < addHours(eventItem.mEndDateTime, 3)) && ($scope.eventTime.mEndToServer > subtractHours(eventItem.mStartDateTime, 3))) { // overlaps
                isEventOverlaps = true;

                Notification.error({
                  message: "Halls '" + commonHallNamesArray + "' are already booked on the date between startdate: " + convertDate($scope.eventTime.mStartToServer) + " enddate: " + convertDate($scope.eventTime.mEndToServer),
                  title: '<i class="glyphicon glyphicon-remove"></i> Hall Booking Overlap !!!'
                });

                break;
              }
            }
          }

          if (!isEventOverlaps) {
            if ($scope.mixins._id) {
              NewbookingsService.update($scope.mixins, successCallback, errorCallback);
            } else {
              NewbookingsService.save($scope.mixins, successCallback, errorCallback);
            }
          }
        });

        function successCallback(res) {
          if ($scope.ui.createMode) //Create booking
          {
            createEventsInGoogleCalendar(res);
          } else //Edit booking
          {
            updateEventsInGoogleCalendar(res);
          }
        };

        function errorCallback(res) {
          Notification.error({
            message: res.data.message,
            title: '<i class="glyphicon glyphicon-remove"></i> Create Booking Error !!!'
          });
        };

      };
    };

    function createEventsInGoogleCalendar(res) {
      var calendarListReq = gapi.client.calendar.calendarList.list();
      calendarListReq.execute(function(respCalList) {
        if (respCalList && respCalList.hasOwnProperty('error')) // error
        {
          Notification.error({
            message: "Unable to fetch the halls from Google Calendar",
            title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
          });

          showBookingCompleteMessage(res);
        } else // success
        {
          var processedHalls = 0;
          angular.forEach($scope.mixins.mSelectedHalls, function(hall) {

            var matchedCalendars = _.filter(respCalList.items, function(obj) {
              return obj.summary.toLowerCase().trim() === hall.name.toLowerCase().trim();
            });

            if (matchedCalendars.length > 0) {
              var matchedCalendar = matchedCalendars[0];
              var eventName = ($scope.mixins.mSelectedEventType.name === HARDCODE_VALUES[0]) ? $scope.mixins.mOtherEvent : $scope.mixins.mSelectedEventType.name;

              var insertEventReq = gapi.client.calendar.events.insert({
                calendarId: matchedCalendar.id,
                start: {
                  timeZone: 'Asia/Kolkata',
                  dateTime: $scope.eventTime.mStartToServer
                },
                end: {
                  timeZone: 'Asia/Kolkata',
                  dateTime: $scope.eventTime.mEndToServer
                },
                description: $scope.mixins.mDescription,
                summary: eventName
              });

              insertEventReq.execute(function(insertEventRes) {
                processedHalls++;

                if (insertEventRes && insertEventRes.hasOwnProperty('error')) // error
                {
                  Notification.error({
                    message: "Unable to add the event in " + matchedCalendar.summary,
                    title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
                  });
                } else // success
                {
                  hall.mCalendarId = matchedCalendar.id;
                  hall.mEventId = insertEventRes.id;
                }

                if (processedHalls === $scope.mixins.mSelectedHalls.length) {
                  updateCalendarData(res);
                }
              });
            } else {
              processedHalls++;
              if (processedHalls === $scope.mixins.mSelectedHalls.length) {
                updateCalendarData(res);
              }

              Notification.warning({
                message: "Unable to find the " + hall.name + " in Google Calendar",
                title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Warning !!!'
              });
            }
          });
        }

      });
    };

    function updateEventsInGoogleCalendar(res) {
     
      var removedHalls = _.pullAllBy(selectedEvent.mSelectedHalls, $scope.mixins.mSelectedHalls, '_id');
      if (removedHalls.length > 0) 
      {
        var deleteProcessedHalls = 0;
        angular.forEach(removedHalls, function(hall) {

          var deleteEventReq = gapi.client.calendar.events.delete({
                calendarId: hall.mCalendarId,
                eventId: hall.mEventId
              });

          deleteEventReq.execute(function(response) {
            deleteProcessedHalls++;
            if (response && response.hasOwnProperty('error')) // error
            {
              Notification.warning({
                message: "Unable to remove the event from "+hall.name+" hall in Google Calendar",
                title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
              });
            } else // success
            {
              //no need to do anything.
            }

            if (deleteProcessedHalls == removedHalls.length) 
            {
              insertOrUpdateEventInGoogleCalendar(res);
            }
          });

        });
      }
      else
      {
        insertOrUpdateEventInGoogleCalendar(res);
      }      
    };

    function insertOrUpdateEventInGoogleCalendar(res)
    {
      var calendarListReq = gapi.client.calendar.calendarList.list();
      calendarListReq.execute(function(respCalList) {
        if (respCalList && respCalList.hasOwnProperty('error')) // error
        {
          Notification.error({
            message: "Unable to fetch the halls from Google Calendar",
            title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
          });

          showBookingCompleteMessage(res);
        } else // success
        {
          var processedHalls = 0;
          angular.forEach($scope.mixins.mSelectedHalls, function(hall) {

            if (hall.hasOwnProperty('mCalendarId') && hall.hasOwnProperty('mEventId')) { //Update

              var eventName = ($scope.mixins.mSelectedEventType.name === HARDCODE_VALUES[0]) ? $scope.mixins.mOtherEvent : $scope.mixins.mSelectedEventType.name;

              var updateEventReq = gapi.client.calendar.events.update({
                calendarId: hall.mCalendarId,
                eventId: hall.mEventId,
                start: {
                  timeZone: 'Asia/Kolkata',
                  dateTime: $scope.eventTime.mStartToServer
                },
                end: {
                  timeZone: 'Asia/Kolkata',
                  dateTime: $scope.eventTime.mEndToServer
                },
                description: $scope.mixins.mDescription,
                summary: eventName
              });
              updateEventReq.execute(function(updateEventRes) {
                processedHalls++;

                if (updateEventRes && updateEventRes.hasOwnProperty('error')) // error
                {
                  Notification.error({
                    message: "Unable to update the event in " + hall.name,
                    title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
                  });
                } else // success
                {
                  hall.mCalendarId = hall.mCalendarId;
                  hall.mEventId = updateEventRes.id;
                }

                if (processedHalls === $scope.mixins.mSelectedHalls.length) {
                  updateCalendarData(res);
                }
              });
            } else //Insert
            {
              var matchedCalendars = _.filter(respCalList.items, function(obj) {
                return obj.summary.toLowerCase().trim() === hall.name.toLowerCase().trim();
              });

              if (matchedCalendars.length > 0) {
                var matchedCalendar = matchedCalendars[0];
                var eventName = ($scope.mixins.mSelectedEventType.name === HARDCODE_VALUES[0]) ? $scope.mixins.mOtherEvent : $scope.mixins.mSelectedEventType.name;

                var insertEventReq = gapi.client.calendar.events.insert({
                  calendarId: matchedCalendar.id,
                  start: {
                    timeZone: 'Asia/Kolkata',
                    dateTime: $scope.eventTime.mStartToServer
                  },
                  end: {
                    timeZone: 'Asia/Kolkata',
                    dateTime: $scope.eventTime.mEndToServer
                  },
                  description: $scope.mixins.mDescription,
                  summary: eventName
                });

                insertEventReq.execute(function(insertEventRes) {
                  processedHalls++;

                  if (insertEventRes && insertEventRes.hasOwnProperty('error')) // error
                  {
                    Notification.error({
                      message: "Unable to add the event in " + matchedCalendar.summary,
                      title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
                    });
                  } else // success
                  {
                    hall.mCalendarId = matchedCalendar.id;
                    hall.mEventId = insertEventRes.id;
                  }

                  if (processedHalls === $scope.mixins.mSelectedHalls.length) {
                    updateCalendarData(res);
                  }
                });
              } else {
                processedHalls++;
                if (processedHalls === $scope.mixins.mSelectedHalls.length) {
                  updateCalendarData(res);
                }

                Notification.warning({
                  message: "Unable to find the " + hall.name + " in Google Calendar",
                  title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Warning !!!'
                });
              }
            }
          });
        }
      });
    }

    function updateCalendarData(res) {
      var updatedData = {
        _id: res._id,
        mSelectedHalls: $scope.mixins.mSelectedHalls
      };
      NewbookingsService.update(updatedData, updateSuccessCallback, updateErrorCallback);

      function updateSuccessCallback(res) {
        showBookingCompleteMessage(res);
      }

      function updateErrorCallback(res) {
        Notification.error({
          message: "Unable to update the Google calendar event details in database",
          title: '<i class="glyphicon glyphicon-remove"></i> Error !!!'
        });

        showBookingCompleteMessage(res);
      };
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.selectHallsByDefault = function(hall) {
      var pluckHalls = _.map($scope.mixins.mSelectedHalls, 'name');
      return _.includes(pluckHalls, hall.name);
    };

    $scope.showMdselect = function() {
      swal({
          title: "Do you want to change the hall?",
          text: "If you change the hall, new rate will be applied.",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes",
          closeOnConfirm: true
        },
        function(isConfirm) {
          if (isConfirm) {
            $scope.ui.showMdSelect = true;
            $scope.$apply();
          }
        });
    };

    $scope.editBooking = function() {
      $scope.ui.viewMode = false;
    }

    $scope.deleteBooking = function() {
      swal({
          title: "Do you want to delete the booking?",
          text: "Booking detail will be deleted permanently.",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes",
          closeOnConfirm: true
        },
        function(isConfirm) {
          if (isConfirm) {
            selectedEvent.$remove(deleteSuccessCallback, deleteErrorCallback);

            function deleteSuccessCallback(res) {
              var deleteProcessedHalls = 0;
              angular.forEach($scope.mixins.mSelectedHalls, function(hall) {

                var deleteEventReq = gapi.client.calendar.events.delete({
                  calendarId: hall.mCalendarId,
                  eventId: hall.mEventId
                });

                deleteEventReq.execute(function(response) {
                  deleteProcessedHalls++;
                  if (response && response.hasOwnProperty('error')) // error
                  {
                    Notification.error({
                      message: "Unable to delete the event from " + hall.name + " hall in Google Calendar",
                      title: '<i class="glyphicon glyphicon-remove"></i> Google Calendar Error !!!'
                    });
                  } else // success
                  {
                    //no need to do anything.
                  }

                  if (deleteProcessedHalls == $scope.mixins.mSelectedHalls.length) {
                    res.isDelete = true;
                    $mdDialog.hide(res);
                  }
                });

              });              
            }

            function deleteErrorCallback(res) {
              Notification.error({
                message: res.data.message,
                title: '<i class="glyphicon glyphicon-remove"></i> Delete Booking Detail Error !!!'
              });
            }
          }
        });
    };

    /**
     * Booking Completion
     */
    function showBookingCompleteMessage(res) {
      Notification.success({
        message: $scope.ui.createMode ? "Booked successfully" : "Updated successfully",
        title: '<i class="glyphicon glyphicon-remove"></i> Success !!!'
      });

      var bookingTitle = res.mSelectedEventType.name;
      if (res.mSelectedEventType.name === HARDCODE_VALUES[0]) {
        bookingTitle = res.mOtherEvent;
      }

      $mdDialog.hide(res);
    };

    function clearPaymentHistory() {
      $scope.mPaymentHistory = {
        amountPaid: null,
        paidDate: new Date(),
        paymentMode: null
      };
    };

    $scope.addPayment = function() {
      pushPayment();
      clearPaymentHistory();
    };

    $scope.removePayment = function(index) {
      $scope.mixins.mPaymentHistories.splice(index, 1);
    };

    function pushPayment() {
      if ($scope.mPaymentHistory.amountPaid && $scope.mPaymentHistory.paymentMode) {
        $scope.mixins.mPaymentHistories.unshift($scope.mPaymentHistory);
      }
    };

    /**
     * Date convertion to YYYY-MM-DD HH:MM:SS
     */

    function convertDate(date) {
      return new Date(date).toString().replace(/GMT.+/, "");
    }

    /**
     * Date convertion to timestamp
     */

    function convertTimeStamp(date) {
      return new Date(date).getTime();
    }

    /**
     * Add hours
     */

    function addHours(dateTime, hours) {

      var addedLocalTime = new Date(dateTime);
      addedLocalTime.setHours(addedLocalTime.getHours() + hours);

      var addedGMT = new Date(addedLocalTime.toUTCString()).toISOString();
      return addedGMT;

    }

    /**
     * Subtract hours
     */

    function subtractHours(dateTime, hours) {

      var subtractedLocalTime = new Date(dateTime);
      subtractedLocalTime.setHours(subtractedLocalTime.getHours() - hours);

      var subtractedGMT = new Date(subtractedLocalTime.toUTCString()).toISOString();
      return subtractedGMT;
    }

    function calculateProrateCharges() {
      for (var i = 0; i < $scope.mixins.mSelectedHalls.length; i++) {

        //individual discounts
        $scope.mixins.mSelectedHalls[i].Discount = {
          mRateDiscount: ($scope.mixins.mSelectedHalls[i].mBasicCost / totalCostToDiscountProrate) * $scope.mixins.mDiscount,
          mElectricityDiscount: ($scope.mixins.mSelectedHalls[i].mElectricityCharges / totalCostToDiscountProrate) * $scope.mixins.mDiscount,
          mCleaningDiscount: ($scope.mixins.mSelectedHalls[i].mCleaningCharges / totalCostToDiscountProrate) * $scope.mixins.mDiscount
        };

        //Total discount
        var sHall = $scope.mixins.mSelectedHalls[i];
        var discounts = sHall.Discount;
        $scope.mixins.mSelectedHalls[i].mTotalDiscount = discounts.mRateDiscount + discounts.mElectricityDiscount + discounts.mCleaningDiscount;

        $scope.mixins.mSelectedHalls[i].GST = {
          mRateCGST: (sHall.mBasicCost - discounts.mRateDiscount) * cgstPercent,
          mRateSGST: (sHall.mBasicCost - discounts.mRateDiscount) * sgstPercent,
          mElectricityCGST: (sHall.mElectricityCharges - discounts.mElectricityDiscount) * cgstPercent,
          mElectricitySGST: (sHall.mElectricityCharges - discounts.mElectricityDiscount) * sgstPercent,
          mCleaningCGST: (sHall.mCleaningCharges - discounts.mCleaningDiscount) * cgstPercent,
          mCleaningSGST: (sHall.mCleaningCharges - discounts.mCleaningDiscount) * sgstPercent,
          mGeneratorCGST: sHall.mGeneratorCharges * cgstPercent,
          mGeneratorSGST: sHall.mGeneratorCharges * sgstPercent,
          mMiscellaneousCGST: sHall.mMiscellaneousCharges * cgstPercent,
          mMiscellaneousSGST: sHall.mMiscellaneousCharges * sgstPercent,
          mDamagesCGST: sHall.mDamages * cgstPercent,
          mDamagesSGST: sHall.mDamages * sgstPercent
        };

        var GSTs = $scope.mixins.mSelectedHalls[i].GST;
        $scope.mixins.mSelectedHalls[i].mTotalCGST = GSTs.mRateCGST + GSTs.mElectricityCGST + GSTs.mCleaningCGST + GSTs.mGeneratorCGST + GSTs.mMiscellaneousCGST + GSTs.mDamagesCGST;

        $scope.mixins.mSelectedHalls[i].mTotalSGST = GSTs.mRateSGST + GSTs.mElectricitySGST + GSTs.mCleaningSGST + GSTs.mGeneratorSGST + GSTs.mMiscellaneousSGST + GSTs.mDamagesSGST;

        //All rate before applying the discount 
        $scope.mixins.mSelectedHalls[i].mRevenue = $scope.mixins.mSelectedHalls[i].mBasicCost + $scope.mixins.mSelectedHalls[i].mElectricityCharges 
                                                  + $scope.mixins.mSelectedHalls[i].mCleaningCharges + $scope.mixins.mSelectedHalls[i].mGeneratorCharges 
                                                  + $scope.mixins.mSelectedHalls[i].mMiscellaneousCharges + $scope.mixins.mSelectedHalls[i].mDamages 
                                                  + $scope.mixins.mSelectedHalls[i].mTotalCGST + $scope.mixins.mSelectedHalls[i].mTotalSGST;
        
        
      }
    }

    function calculateHallsRate() {
      var basicCost = CommonService.sumOfArray(_.map($scope.mixins.mSelectedHalls, 'mBasicCost'));
      var electricityCost = CommonService.sumOfArray(_.map($scope.mixins.mSelectedHalls, 'mElectricityCharges'));
      var cleaningCost = CommonService.sumOfArray(_.map($scope.mixins.mSelectedHalls, 'mCleaningCharges'));
      var generatorCost = CommonService.sumOfArray(_.map($scope.mixins.mSelectedHalls, 'mGeneratorCharges'));
      var miscellaneousCost = CommonService.sumOfArray(_.map($scope.mixins.mSelectedHalls, 'mMiscellaneousCharges'));
      var damageCost = CommonService.sumOfArray(_.map($scope.mixins.mSelectedHalls, 'mDamages'));

      $scope.taxableChargesBeforeDiscount = Number(basicCost) + Number(electricityCost) + Number(cleaningCost) +
        Number(generatorCost) + Number(miscellaneousCost) + Number(damageCost);

      totalCostToDiscountProrate = Number(basicCost) + Number(electricityCost) + Number(cleaningCost);

      console.log("basicCost " + basicCost);
      console.log("electricityCost " + electricityCost);
      console.log("cleaningCost " + cleaningCost);
      console.log("miscellaneousCost " + miscellaneousCost);
      console.log("$scope.generatorCost " + generatorCost);
      console.log("damageCost " + damageCost);
      console.log("taxableChargesBeforeDiscount " + $scope.taxableChargesBeforeDiscount);
    }
  }
}());