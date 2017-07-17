(function() {
  'use strict';

  angular
    .module('core')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$state', '$rootScope', '$mdDialog', '$mdToast', 'HallsService', 'EventtypesService', 'TaxesService'];

  function SettingsController($scope, $state, $rootScope, $mdDialog, $mdToast, HallsService, EventtypesService, TaxesService) {
    
    
    $scope.loadInitial = function() {
      $scope.halls = HallsService.query();
      $scope.taxes = TaxesService.query();
      $scope.eventTypes = EventtypesService.query();
    };

    /** CRUD Functionality for Hall **/

    $scope.mShowHallPopup = function(ev, index = null, hall = null) {
      $mdDialog.show({
          controller: 'HallsController',
          templateUrl: 'modules/halls/client/views/form-hall.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false,
          fullscreen: true,
          resolve: {
            hallResolve: function() {
              return hall;
            }
          },
        })
        .then(function(updatedItem) {
          if (hall) {
            $scope.halls[index] = updatedItem
          } else {
            $scope.halls.push(updatedItem);
          }
        }, function() {
          console.log('You cancelled the dialog.');          
        });
    }

    $scope.mDeleteHall = function(ev, hall) {
      var confirm = $mdDialog.confirm()
        .title('Do you want to delete the ' + hall.name + ' hall?')
        .textContent('Hall will be deleted permanently.')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No');

      $mdDialog.show(confirm).then(function() {
          hall.$remove(successCallback, errorCallback);

          function successCallback(res) {
           $scope.halls.pop(hall);
          }

          function errorCallback(res) {
            $mdToast.show($mdToast.simple().textContent(res.data.message).position('bottom right').hideDelay(3000));
          }
        },
        function() {
          console.log("no");
        });
    }

     /** CRUD Functionality for Tax **/

    $scope.mShowTaxPopup = function(ev, index = null, tax = null) {
      $mdDialog.show({
          controller: 'TaxesController',
          templateUrl: 'modules/taxes/client/views/form-tax.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false,
          fullscreen: true,
          resolve: {
            taxResolve: function() {
              return tax;
            }
          },
        })
        .then(function(updatedItem) {
          if(tax) {
            $scope.taxes[index] = updatedItem
          } else {
            $scope.taxes.push(updatedItem);
          }          
        }, function() {
          console.log('You cancelled the dialog.');          
        });

    }

     /** CRUD Functionality for EventType **/

    $scope.mShowEventTypePopup = function(ev, index = null, eventType = null) {
      $mdDialog.show({
          controller: 'EventtypesController',
          templateUrl: 'modules/eventtypes/client/views/form-eventtype.client.view.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false,
          fullscreen: true,
          resolve: {
            eventtypeResolve: function() {
              return eventType;
            }
          },
        })
        .then(function(updatedItem) {
          if (eventType) {
            $scope.eventTypes[index] = updatedItem
          } else {
            $scope.eventTypes.push(updatedItem);
          }
        }, function() {
          console.log('You cancelled the dialog.');
        });

    }

    $scope.mDeleteEventType = function(ev, eventType) {
      var confirm = $mdDialog.confirm()
        .title('Do you want to delete "' + eventType.name + '"?')
        .textContent('Event type will be deleted permanently.')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No');

      $mdDialog.show(confirm).then(function() {
          eventType.$remove(successCallback, errorCallback);

          function successCallback(res) {
            $scope.eventTypes.pop(eventType);
          }

          function errorCallback(res) {
            $mdToast.show($mdToast.simple().textContent(res.data.message).position('bottom right').hideDelay(3000));
          }
        },
        function() {
          console.log("no");
        });
    }



    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    function stateChangeSuccess() {
      $scope.cancel();
    }

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

  }


}());