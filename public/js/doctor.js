(function () {

	var medconnect = angular.module("mcDoctor", []);

	medconnect.controller('DoctorHome', ['$http', '$scope', '$location', function($http, $scope, $location){
		$scope.logout = function(){
			$http.get('/logout')
			.success(function(){
				$location.url('/')
			})
		}
	}])

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

		$scope.open = function (error) {

			if(error){
	      $scope.item = ["Missing/Incorrect fields, please try again."];
	    }else{
				$scope.item = ["Congratulations, you have successfully registered as a doctor", "doctor"];
			}

			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: '/views/modal.html',
				controller: 'ModalInstanceCtrl',
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
					$scope.open();
				}).error(function (err) {
					$scope.open(true);
					console.log('Server error: ' + err);
				})
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

		var receiveInputs = function () {
			if (vm.firstName && vm.lastName && vm.address && vm.phoneNumber && vm.code) {
				return true;
			}
			return false;
		}

		vm.save = function () {
			if(receiveInputs()){
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
						$scope.open();
					}).error(function(err){
						$scope.open(true);
						console.log('Server error: ' + err);
					})
			}
		}
		// Modal open
		$scope.open = function (error) {

	    if(error){
	      $scope.item = ["Missing/Incorrect fields, please try again"];
	    }else{
	      $scope.item = ["You have successfully edited your profile as a doctor", "doctor"];
	    }
	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/modal.html',
	      controller: 'ModalInstanceCtrl',
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

		medconnect.controller('doctorAppointments', ['$http', '$scope', '$location', function($http, $scope, $location){
			$scope.req = true;
		  $scope.acc = true;

		  $http.get('/doctor/getCurrentAppointments').success(function(info){
		    if(info.requested.length > 0){
		      $scope.requested = info.requested;
		    }else{
		      $scope.req = false;
		    }
		    if(info.accepted.length > 0){
		      $scope.accepted = info.accepted;
		    }else{
		      $scope.acc = false;
		    }
		  }).catch(function(error){
		    console.log("Error is : " + error);
		  });

		  $scope.appointmentDetails = function(id){
		    var visitID = id;
		    $location.url("/doctor/appointmentDetails/" + visitID);
		  }

		}]);

	medconnect.controller('DoctorPastPatients', ['$http', '$scope', function($http, $scope){
		$scope.pastPatients = []
		$scope.init = function(){
			getData();
		}

		var getData = function(){
			$http.get('/doctor/getPastPatients')
				.success(function(result){
					$scope.pastPatients = result
				})
				.error(function(err){

				})
		}

	}]);

	medconnect.controller('DoctorPastAppointments', ['$http', '$scope', '$routeParams', function($http, $scope, $routeParams){
		$scope.pastAppointments = []
		$scope.name = null
		$scope.init = function(){
			getData();
		}

		var getData = function(){
			$http.post('/doctor/getPastAppointments', {
				patientID: $routeParams.id
			})
			.success(function(result){
				$scope.pastAppointments = result
				$scope.name = result[0].firstName + ' ' + result[0].lastName
			})
			.error(function(err){

			})
		}
	}]);

	medconnect.controller('DoctorAvaliable', function ($scope, $filter, $http, $uibModal) {

		var d = new Date();
		d.setHours( 0 );
		d.setMinutes( 0 );

		$scope.checkboxModel = {
		 monday : false,
		 tuesday : false,
		 wednesday : false,
		 thursday : false,
		 friday : false,
		 saturday : false,
		 sunday : false
	 };

		$http.get('/doctor/info').success(function (info) {
			if(info.availability){

				var a = JSON.parse(info.availability);

				$scope.ms = a[0][1];
				$scope.me = a[0][2];
				$scope.tus = a[1][1];
				$scope.tue = a[1][2];
				$scope.ws = a[2][1];
				$scope.we = a[2][2];
				$scope.ths = a[3][1];
				$scope.the = a[3][2];
				$scope.fs = a[4][1];
				$scope.fe = a[4][2];
				$scope.sas = a[5][1];
				$scope.sae = a[5][2];
				$scope.sus = a[6][1];
				$scope.sue = a[6][2];

				if(a[0][1] === "unavaliable"){
					$scope.checkboxModel.monday = true;
					$scope.ms = d;
					$scope.me = d;
				}
				if(a[1][1] === "unavaliable"){
					$scope.checkboxModel.tuesday = true;
					$scope.tus = d;
					$scope.tue = d;
				}
				if(a[2][1] === "unavaliable"){
					$scope.checkboxModel.wednesday = true;
					$scope.ws = d;
					$scope.we = d;
				}
				if(a[3][1] === "unavaliable"){
					$scope.checkboxModel.thursday = true;
					$scope.ths = d;
					$scope.the = d;
				}
				if(a[4][1] === "unavaliable"){
					$scope.checkboxModel.friday = true;
					$scope.fs = d;
					$scope.fe = d;
				}
				if(a[5][1] === "unavaliable"){
					$scope.checkboxModel.saturday = true;
					$scope.sas = d;
					$scope.sae = d;
				}
				if(a[6][1] === "unavaliable"){
					$scope.checkboxModel.sunday = true;
					$scope.sus = d;
					$scope.sue = d;
				}

			}else{

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

				$scope.hstep = 1;
				$scope.mstep = 15;
			}
		}).catch(function (error) {
			console.log("Error is : ", error);
		});

			$scope.submit = function(){

				if($scope.checkboxModel.monday){
					$scope.ms = "unavaliable", $scope.me = "unavaliable";
				}
				if($scope.checkboxModel.tuesday){
					$scope.tus = "unavaliable", $scope.tue = "unavaliable";
				}
				if($scope.checkboxModel.wednesday){
					$scope.ws = "unavaliable", $scope.we = "unavaliable";
				}
				if($scope.checkboxModel.thursday){
					$scope.ths = "unavaliable", $scope.the = "unavaliable";
				}
				if($scope.checkboxModel.friday){
					$scope.fs = "unavaliable", $scope.fe = "unavaliable";
				}
				if($scope.checkboxModel.saturday){
					$scope.sas = "unavaliable", $scope.sae = "unavaliable";
				}
				if($scope.checkboxModel.sunday){
					$scope.sus = "unavaliable", $scope.sue = "unavaliable";
				}

				$scope.scheduleArr = [
					['Monday', $scope.ms,  $scope.me],
					['Tuesday', $scope.tus, $scope.tue],
					['Wednesday', $scope.ws, $scope.we],
					['Thursday', $scope.ths, $scope.the],
					['Friday', $scope.fs, $scope.fe],
					['Saturday', $scope.sas, $scope.sae],
					['Sunday', $scope.sus, $scope.sue]
				]

				$http({
					method: 'POST',
					url: '/doctor/setAvailability',
					data: {
						data: JSON.stringify($scope.scheduleArr)
					}
				}).success(function (data) {
					$scope.open()
				}).error(function (err) {
					$scope.open(true)
				})

			}

			$scope.open = function (error) {

				var modalInstance = $uibModal.open({
					animation: true,
					templateUrl: '/views/modal.html',
					controller: 'scheduleTable',
					resolve: {
						item : function(){
							return $scope.scheduleArr
						}
					}
				});
			};
	});

	medconnect.controller('DoctorAppointmentDetails', ['$http', '$location', '$scope', '$uibModal', '$routeParams', '$window', function($http, $location, $scope, $uibModal, $routeParams, $window){

	  var visitID = $routeParams.visit_id;
	  var diaEdit = false
	  var symEdit = false

		$scope.waiting = true

	  $http({
	    method: 'POST',
	    url: '/doctor/getAppointmentDetail',
	    data: {
	      visitID : visitID
	    }
	  }).success(function (data) {
	    $scope.canComplete = data.visit.visitStatus === 3
	    $scope.name = data.visit.firstName + " " + data.visit.lastName;
	    $scope.date = data.visit.visitDate;
	    $scope.diagnosis = data.visit.diagnosis;
	    $scope.symptoms = data.visit.symptoms;
	    $scope.notes = data.notes;
	    $scope.prescriptions = data.prescriptions;
	    $scope.images = data.images;
	    $scope.vitals = data.vitals

			if(data.visit.visitStatus === 1){
				$scope.requested = true
			}else{
				$scope.requested = false
			}
			$scope.waiting = false
	  }).error(function (err) {
	    console.log("error")
	  })

	  $scope.complete = function (){
	    $http.post('/doctor/completeAppointment', {
	      visitID: visitID
	    }).success(function (){
	      $location.path('/doctor/appointments')
	    })
	  }

		$scope.accept = function(){
			$http.post('/doctor/handleRequestedAppointment', {
				visitID: visitID,
				acceptVisit : 1
			})
			$location.path('/doctor/appointments')
		}

		$scope.reject = function(){
			$http.post('/doctor/handleRequestedAppointment', {
				visitID: visitID,
				acceptVisit : 0
			})
			$location.path('/doctor/appointments')
		}

	  $scope.saveVisit = function (){
	    $http.post('/doctor/editAppointmentDetails', {
	      visitID: visitID,
	      diagnosis: $scope.diagnosis,
	      symptoms: $scope.symptoms
	    })
	  }

	  $scope.viewVital = function (vitals) {
	    vitals.userType = 'doctor'
	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/viewVitals.html',
	      controller: 'viewVitals',
	      resolve: {
	        item : function(){
	          return vitals
	        }
	      }
	    });
	    modalInstance.result.then(function (fields) {
	      $scope.vitals = fields
	    });
	  }

	  $scope.addPre = function () {

	    var item = [visitID, "doctor"];

	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/addPrescription.html',
	      controller: 'prescriptions',
	      resolve: {
           item : function(){
             return item;
           }
         }
	    });
	    modalInstance.result.then(function (fields) {
	      $scope.prescriptions.push(fields)
	    });
	  }

	  $scope.addNote = function () {

			var item = [visitID, "doctor"];
	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/addNote.html',
	      controller: 'Note',
	      resolve: {
	           item : function(){
	             return item
	           }
	         }
	    });
	    modalInstance.result.then(function (fields) {
	      $scope.notes.push(fields);
	    });
	  }

	  $scope.viewPre = function (pre) {
	    pre.userType = 'doctor'
	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/viewPrescriptions.html',
	      controller: 'viewPrescriptions',
	      resolve: {
	        item : function(){
	          return pre;
	        }
	      }
	    });
	    modalInstance.result.then(function (index) {
	      $scope.prescriptions.splice(index, 1);
	    });
	  }

	  $scope.addImage = function () {

	    var item= [visitID, "doctor"];

	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/addUpload.html',
	      controller: 'upload',
	      resolve: {
	           item : function(){
	             return item;
	           }
	         }
	    });
	    modalInstance.result.then(function (fields) {
	      $scope.images.push(fields)
	    });
	  }

	  $scope.viewNote = function (note) {
			var item = [note, "doctor"];
	    var modalInstance = $uibModal.open({
	      animation: true,
	      templateUrl: '/views/viewNote.html',
	      controller: 'viewNote',
	      resolve: {
	        item : function(){
	          return item;
	        }
	      }
	    });
	    modalInstance.result.then(function (index) {
	      $scope.notes.splice(index, 1);
	    });
	  }

	  $scope.viewImage = function (filePath) {
	    $window.open(filePath)
	  }

	}]);

}());
