(function () {

	var medconnect = angular.module("mcDoctor", []);

	medconnect.controller('DoctorRegister', ['$http', '$location', '$uibModal', '$scope', function ($http, $location, $uibModal, $scope) {

		var vm = this;

		var receiveInputs = function () {
			if (vm.email && vm.firstName && vm.lastName && vm.address && vm.phoneNumber && vm.password && vm.passwordConfirm && vm.code) {
				if (vm.password === vm.passwordConfirm) {
					return true;
				}
			}
			return false;
		}

		$scope.open = function (error, size) {

			if(error){
				$scope.item = "Missing/Incorrect fields, please try again.";
			}else{
				$scope.item = "Congratulations, you have successfully registered!";
			}
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: '../views/modal.html',
				controller: 'ModalInstanceCtrl',
				size: size,
				resolve: {
					item : function(){
						return $scope.item;
					}
				}
			});
		};

		vm.register = function () {
			if (receiveInputs()) {
				$http({
					method: 'POST',
					url: '/doctor/register',
					data: {
						'email': vm.email,
						'first': vm.firstName,
						'last': vm.lastName,
						'address': vm.address,
						'phone': vm.phoneNumber,
						'password': vm.password,
						'code': vm.code
					}
				}).success(function (data) {
					$scope.open(false);
					console.log(data);
				}).error(function (err) {
					$scope.open(true);
					console.log('Server error: ' + err);
				})
			} else {
				$scope.open(true);
			}
		}

  }]);

	medconnect.controller('DoctorProfile', ['$http','$location', '$uibModal', '$scope', function ($http, $location, $uibModal, $scope) {

		var vm = this;
		vm.editMode = false;
		vm.ids = [];
		vm.items = []; // list of specialties to choose
		$scope.alerts = [];
		vm.error = false;
		vm.message = "";

		$http.get('/doctor/info').success(function (info) {
			var specs = info.specialties;
			if(specs.length <= 0){
				vm.empty = true;
				console.log(true)
			}
			for(var o in specs) {
				var spec = specs[o];
				spec.msg = spec.name;
				$scope.alerts.push(spec)
				vm.ids.push(spec._id);
			}
			vm.email = info.email;
			vm.firstName = info.firstName;
			vm.lastName = info.lastName;
			vm.address = info.address;
			vm.phoneNumber = info.phone;
			vm.code = info.code;
			vm.experience = info.exp;
			vm.volunteerNotes = info.vol;
			vm.otherNotes = info.notes;
		}).catch(function (error) {
			console.log("Error is : ", error);
		});

		vm.edit = function () {
			$http({
					method: 'POST',
					url: '/data/getStatic',
					data: {
						'type': 'specialties'
					}
				}).success(function(items){
					vm.items = items;
				});

			vm.editMode = !vm.editMode;
		}

		vm.add = function(){
			if(vm.ids.indexOf(vm.selectedItem._id) >= 0){
				vm.error = true;
				vm.message = "Duplicate speciality";
				return false;
			}else{
				vm.empty = false;
				vm.ids.push(vm.selectedItem._id);
				$scope.alerts.push({msg:vm.selectedItem.name});
				vm.error = false;
				return true;
			}
		}

		vm.save = function () {
			$http({
					method: 'POST',
					url: '/doctor/edit',
					data: {
						'firstName': vm.firstName,
						'lastName': vm.lastName,
						'address': vm.address,
						'phone': vm.phoneNumber,
						'experience': vm.experience,
						'volunteerNotes': vm.volunteerNotes,
						'otherNotes': vm.otherNotes,
						'specialties' : vm.ids,
						'code': vm.code
					}
				}).success(function(data){
	        $scope.open(false);
	        console.log(data);
	      }).error(function(err){
	        $scope.open(true);
	        console.log('Server error: ' + err);
	      })
		}
		// Modal open
		$scope.open = function (error, size) {

	    if(error){
	      $scope.item = "Missing/Incorrect fields, please try again";
	    }else{
	      $scope.item = "You have successfully edited your profile";
	    }
	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '../views/modal.html',
	      controller: 'ModalInstanceCtrl',
	      size: size,
	      resolve: {
	        item : function(){
	          return $scope.item;
	        }
	      }
	    });
	  };
		// Alert close
		$scope.closeAlert = function(index) {
			if(!vm.editMode){

			}else{
				vm.ids.splice(index, 1);
				$scope.alerts.splice(index, 1);
			}
		};

  }]);

	medconnect.controller('DoctorAvaliable', function ($scope, $filter, $http, $uibModal) {

			var d = new Date();
			d.setHours( 0 );
			d.setMinutes( 0 );

			$scope.ms = d;
			$scope.me = d;
			$scope.tus = d;
			$scope.tue = d;
			$scope.ws = d;
			$scope.we = d;
			$scope.ths = d;
			$scope.the = d;
			$scope.fs = d;
			$scope.fe = d;
			$scope.sas = d;
			$scope.sae = d;
			$scope.sus = d;
			$scope.sue = d;

			$scope.ismeridian = false;
		  $scope.hstep = 1;
		  $scope.mstep = 15;

			$scope.submit = function(){

				// Days, starttime, endtime, don't modify this array, I am using it for modal
				$scope.scheduleArr = [
					['Monday', $filter('date')($scope.ms, 'shortTime'),  $filter('date')($scope.me, 'shortTime')],
					['Tuesday', $filter('date')($scope.tus, 'shortTime'), $filter('date')($scope.tue, 'shortTime')],
					['Wendesday', $filter('date')($scope.ws, 'shortTime'), $filter('date')($scope.we, 'shortTime')],
					['Thursday', $filter('date')($scope.ths, 'shortTime'), $filter('date')($scope.the, 'shortTime')],
					['Friday', $filter('date')($scope.fs, 'shortTime'),$filter('date')($scope.fe, 'shortTime')],
					['Saturday', $filter('date')($scope.sas, 'shortTime'), $filter('date')($scope.sae, 'shortTime')],
					['Sunday', $filter('date')($scope.sus, 'shortTime'), $filter('date')($scope.sue, 'shortTime')]
				]

 				// opens up modal
				$scope.open(false);
				$http({
					method: 'POST',
					url: '/doctor/setAvailability',
					data: {
						data: JSON.stringify($scope.scheduleArr)
					}
				}).success(function (data) {
					$scope.open(false)
				}).error(function (err) {
					$scope.open(true)
				})

			}

			$scope.open = function (error, size) {

				if(error){
					$scope.item = "Server Error, try back again later please";
				}else{
					$scope.item = "Congratulations, you have successfully registered!";
				}
				var modalInstance = $uibModal.open({
					animation: true,
					templateUrl: '../views/modal.html',
					controller: 'ModalInstanceCtrl',
					size: size,
					resolve: {
						item : function(){
							return $scope.scheduleArr
						}
					}
				});
			};

		});

}());
