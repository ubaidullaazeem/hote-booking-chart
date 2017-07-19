(function () {
  'use strict';

  // Halls controller
  angular
    .module('taxes')
    .controller('TaxesController', TaxesController);

  TaxesController.$inject = ['DATA_BACKGROUND_COLOR', '$scope', '$state', '$rootScope', '$window', 'Authentication', '$mdDialog', '$mdToast', 'taxResolve', 'TaxesService'];

  function TaxesController (DATA_BACKGROUND_COLOR, $scope, $state, $rootScope, $window, Authentication, $mdDialog, $mdToast, tax, TaxesService) 
  {   
    $scope.model = {
      tax: {
        name: tax ? tax.name : undefined,
        percentage: tax ? tax.percentage : undefined,        
        _id: tax ? tax._id : undefined
      }
    };

    $scope.ui = {
      mNumberPattern: /^[0-9]*$/
    };

    $scope.DATA_BACKGROUND_COLOR = DATA_BACKGROUND_COLOR;
    
    $scope.save = function(createTaxForm)
    {       
      $scope.createTaxForm = createTaxForm;
      if (createTaxForm.$valid) 
      {     
        if ($scope.model.tax._id) 
        {
          TaxesService.update($scope.model.tax, successCallback, errorCallback);
        } 
        else 
        {
          TaxesService.save($scope.model.tax, successCallback, errorCallback);
        }        

        function successCallback(res) 
        {          
          $mdDialog.hide(res);
        }

        function errorCallback(res) 
        {
          $mdToast.show($mdToast.simple().textContent(res.data.message).position('bottom right').hideDelay(3000));
        }
      }
    }

    $scope.cancel = function()
    {
      $mdDialog.cancel();
    }    
  }
}());