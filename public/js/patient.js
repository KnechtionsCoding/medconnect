(function(){

var medconnect = angular.module("mcPatient", []);

medconnect.controller('PatientHome', ['$http', '$scope', '$location', function($http, $scope, $location){
  $scope.logout = function(){
    $http.get('/logout')
    .success(function(){
      $location.url('/')
    })
  }
}])

medconnect.controller('PatientRegister', ['$http', '$location', '$uibModal', '$scope', function($http, $location, $uibModal, $scope){

  var vm = this;

  var receiveInputs = function(){
    if(vm.email && vm.firstName && vm.lastName && vm.gender && vm.address && vm.phoneNumber && vm.password && vm.passwordConfirm){
      if(vm.password === vm.passwordConfirm){
        return true;
      }
    }
    return false;
  }

  $scope.open = function (error) {

    if(error){
      $scope.item = ["Missing/Incorrect fields, please try again."];
    }
    else{
      $scope.item = ["Congratulations, you have successfully registered as a patient", "patient"];
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

  vm.register = function(){
    if(receiveInputs()){
      $http({
        method:'POST',
        url:'/patient/register',
        data: {
          'email' : vm.email,
          'first' : vm.firstName,
          'last' : vm.lastName,
          'gender' : vm.gender,
          'address' : vm.address,
          'phone' : vm.phoneNumber,
          'password': vm.password
        }
      }).success(function(data){
        $scope.open();
      }).error(function(err){
        $scope.open(true);
        console.log('Server error: ' + err);
      })
    }
  }

}]);

medconnect.controller('PatientProfile', ['$http', '$location', '$uibModal', '$scope', function($http, $location, $uibModal, $scope){

  var vm = this;
  vm.editMode = false;

	$http.get('/patient/info').success(function(info){
		vm.email = info.email;
		vm.firstName = info.firstName;
		vm.lastName = info.lastName;
		vm.bloodType = info.bloodType;
		vm.address = info.address;
		vm.phoneNumber = info.phone;
	}).catch(function(error){
		console.log("Error is : " + error);
	});

	vm.edit = function(){
    vm.editMode = !vm.editMode;
  }
  $scope.open = function (error) {

    if(error){
      $scope.item = ["Missing/Incorrect fields, please try again."];
    }else{
      $scope.item = ["Congratulations, you have successfully edited your patient profile!", "patient"];
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

  var receiveInputs = function () {
    if (vm.firstName && vm.lastName && vm.address && vm.phoneNumber && vm.code) {
      return true;
    }
    return false;
  }

  vm.save = function(){
    if(receiveInputs()){
      $http({
        method:'POST',
        url:'/patient/edit',
        data: {
          'firstName' : vm.firstName,
          'lastName' : vm.lastName,
          'bloodType' : vm.bloodType,
          'address' : vm.address,
          'phone' : vm.phoneNumber
        }
      }).success(function(data){
        $scope.open();
      }).error(function(err){
        $scope.open(true);
        console.log('Server error: ', err);
      })
    }
  }

}])

medconnect.controller('PatientSearch', ['$http', '$location', function($http, $location){
  var vm = this;
  vm.doctors = [];
  vm.sortField = 'name'; // initialize sorting by lastName
  vm.reverse = true;

  vm.changeOrder = function(){
    vm.reverse = !vm.reverse;
  }

  $http.get('/patient/getDoctors').success(function (doctors){
    vm.doctors = doctors
  })

  vm.viewDoctor = function(doctor){
    var doctorID =  doctor.userID;
    $location.url("/patient/seeDoctor/" + doctorID);
  }

}]);

medconnect.controller('seeDoctor', ['$http', '$location', '$routeParams', function($http, $location, $routeParams){
  var vm = this;
  var doctorID = $routeParams.doctor_id

  $http.post('/patient/specific-doctor', {
    'id' : doctorID
  }).success(function(doctor){
    vm.verified = doctor.ver
    vm.name = doctor.first + ' ' + doctor.last
    vm.location = doctor.loc
    vm.specialties = doctor.specialties.map(function (s){ return s.name }).join(', ')
    vm.experience = doctor.exp
    vm.notes = doctor.notes
    vm.volunteerNotes = doctor.vol
  }).error(function(err){
    console.log('Server error: ' + err)
  })

  vm.next = function(){
    $location.url("/patient/seeDoctorSchedule/" + doctorID);
  }

}]);

medconnect.controller('seeDoctorSchedule', ['$http', '$location', '$uibModal', '$scope', '$routeParams', function($http, $location, $uibModal, $scope, $routeParams){

  var doctorID = $routeParams.doctor_id
  $scope.visit

  $http.post('/patient/specific-doctor', {
    'id' : doctorID
  }).success(function(doctor){
    $scope.lastName = doctor.last
    $scope.availability = JSON.parse(doctor.availability)
  }).error(function(err){
    console.log('Server error: ' + err)
  })

  $scope.submit = function(){

    var date = $scope.date.getDate();
    var month = $scope.date.getMonth();
    var year = $scope.date.getFullYear();
    $scope.time.setUTCDate(date);
    $scope.time.setUTCMonth(month);
    $scope.time.setUTCFullYear(year);

      $http({
      method: 'POST',
      url: '/patient/requestAppointment',
      data: {
        doctorID : doctorID,
        reqDate : $scope.time
      }
    }).success(function (data) {
      $location.url('/patient/viewAppointments')
    }).error(function (err) {
      $scope.open()
    })
  }

  $scope.open = function () {

    $scope.item = ["You have successfully requested an appointment!"];

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

  var d = new Date();
  d.setHours( 0 );
  d.setMinutes( 0 );
  $scope.time = d;
  $scope.date = new Date();

  // Datepicker
  $scope.inlineOptions = {
    customClass: getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  $scope.dateOptions = {
    dateDisabled: disabled,
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(),
    startingDay: 1
  };

  // Disable weekend selection
  function disabled(data) {
    var date = data.date,
      mode = data.mode;
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  }


  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  $scope.altInputFormats = ['M!/d!/yyyy'];

  $scope.popup1 = {
    opened: false
  };

  $scope.popup2 = {
    opened: false
  };

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  $scope.events = [
    {
      date: tomorrow,
      status: 'full'
    },
    {
      date: afterTomorrow,
      status: 'partially'
    }
  ];

  function getDayClass(data) {
    var date = data.date,
      mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }
}]);

medconnect.controller('appointments', ['$http', '$location', '$scope', function($http, $location, $scope){

  $scope.req = true;
  $scope.acc = true;
  $scope.rej = true;

  $http.get('/patient/getCurrentAppointments').success(function(info){
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
    if(info.rejected.length > 0){
      $scope.rejected = info.rejected;
    }else{
      $scope.rej = false;
    }
  }).catch(function(error){
    console.log("Error is : " + error);
  });

  $scope.appointmentDetails = function(id){
    var visitID = id;
    $location.url("/patient/appointmentDetails/" + visitID);
  }

}]);

medconnect.controller('patientRejectedAppts', ['$http', '$scope', '$routeParams', '$location', function($http, $scope, $routeParams, $location){

  var d = new Date();
  d.setHours( 0 );
  d.setMinutes( 0 );
  $scope.newTime = d;
  $scope.newDate = new Date();

  $scope.editable = false
  $scope.visit = {}
  $scope.error = null
  $scope.init = function(){
    getData();
  }

  $scope.delete = function(){
    $http.post('/patient/deleteRejectedAppointment', {
      visitID: $scope.visit.visitID
    }).success(function(result){
      $location.url('/patient/viewAppointments')
    })
  }

  $scope.request = function(){
    $scope.editable = true
  }

  $scope.submit = function(){
    var date = $scope.newDate.getDate();
    $scope.newTime.setDate(date);
    $http.post('/patient/updateRejectedAppointment', {
      visitID: $scope.visit.visitID,
      visitDate: $scope.newTime
    }).success(function(){
      $location.url('/patient/viewAppointments')
    })
  }

  var getData = function(){
    $http.post('/patient/getAppointmentDetail',{
      visitID: $routeParams.visitID
    }).success(function(result){
      $scope.visit = result.visit
    }).error(function(err){
      $scope.error = 'This appointment no longer exists.'
    })
  }

  // Datepicker
  $scope.inlineOptions = {
    customClass: getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  $scope.dateOptions = {
    dateDisabled: disabled,
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(),
    startingDay: 1
  };

  // Disable weekend selection
  function disabled(data) {
    var date = data.date,
      mode = data.mode;
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  }

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  $scope.altInputFormats = ['M!/d!/yyyy'];

  $scope.popup1 = {
    opened: false
  };

  $scope.popup2 = {
    opened: false
  };

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  $scope.events = [
    {
      date: tomorrow,
      status: 'full'
    },
    {
      date: afterTomorrow,
      status: 'partially'
    }
  ];

  function getDayClass(data) {
    var date = data.date,
      mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }
}]);

medconnect.controller('appointmentDetails', ['$http', '$location', '$scope', '$uibModal', '$routeParams', '$window', function($http, $location, $scope, $uibModal, $routeParams, $window){

  var visitID = $routeParams.visit_id;
  var diaEdit = false
  var symEdit = false

  $http({
    method: 'POST',
    url: '/patient/getAppointmentDetail',
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
  }).error(function (err) {
    console.log("error")
  })

  $scope.complete = function (){
    $http.post('/patient/completeAppointment', {
      visitID: visitID
    }).success(function (){
      $location.path('/patient/viewAppointments')
    })
  }

  $scope.saveVisit = function (){
    $http.post('/patient/editAppointmentDetails', {
      visitID: visitID,
      diagnosis: $scope.diagnosis,
      symptoms: $scope.symptoms
    })
  }

  $scope.viewVital = function (vitals) {
    vitals.userType = 'patient'
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

    var item = [visitID, "patient"];

    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/addPrescription.html',
      controller: 'prescriptions',
      resolve: {
           item : function(){
             return item
           }
         }
    });
    modalInstance.result.then(function (fields) {
      $scope.prescriptions.push(fields);
    });
  }

  $scope.addNote = function () {

    var item = [visitID, "patient"];
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
    pre.userType = 'patient'
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

    var item = [visitID, "patient"];

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

    var item = [note, "patient"];
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

medconnect.controller('patientPrescriptions', ['$http', '$scope', '$uibModal', function($http, $scope, $uibModal){
  $scope.init = function(){
    getData()
  }

  $scope.viewPrescription = function(prescriptions){
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/viewPrescriptions.html',
      controller: 'viewPrescriptions',
      resolve: {
        item : prescriptions
      }
    });
    modalInstance.result.then(function() {
      //when we get a prescriptionID, we should splice the prescriptions array on the index of the id
      getData()
    });
  }

  $scope.add = function(){
    $scope.item = {
      visitID: null
    }

    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/addPrescription.html',
      controller: 'prescriptions',
      resolve: {
           item : function(){
             return $scope.item;
           }
         }
    })
    modalInstance.result.then(function (fields) {
      $scope.prescriptions.push(fields)
    });
  }

  var getData = function(){
    $http.get('/patient/getPrescriptions')
      .success(function(result){
        $scope.prescriptions = result
      })
  }
}])

  medconnect.controller('VisitHistory',  ['$http', '$scope', '$location', function($http, $scope, $location){

    $http.get('/patient/getPastAppointments').success(function (data){
      $scope.visits = data
    })

    $scope.appointmentDetails = function(visitID){
      $location.url('/patient/appointmentDetails/' + visitID)
    }

  }])

medconnect.controller('patientNotes', ['$http', '$scope', '$uibModal', function($http, $scope, $uibModal){
  $scope.notes = []
  $scope.init = function(){
    getData()
  }

  $scope.add = function(){
    $scope.item = null
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/addNote.html',
      controller: 'Note',
      resolve: {
        item : function(){
          return $scope.item
        }
      }
    })
    modalInstance.result.then(function(fields){
      $scope.notes.push(fields)
    })
  }

  $scope.viewNote = function (note) {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/viewNote.html',
      controller: 'viewNote',
      resolve: {
        item : function(){
          return note;
        }
      }
    });
    modalInstance.result.then(function (index) {
      $scope.notes.splice(index, 1);
    });
  }

  var getData = function(){
    $http.get('/patient/getNotes')
      .success(function(result){
        $scope.notes = result
      })
  }
}])

medconnect.controller('patientVitals', ['$http', '$scope', '$uibModal', function($http, $scope, $uibModal){
  $scope.vitals = []
  $scope.init = function(){
    getData()
  }

  $scope.add = function(){
    $scope.item = {}
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/viewVitals.html',
      controller: 'viewVitals',
      resolve: {
        item : function(){
          return $scope.item
        }
      }
    })
    modalInstance.result.then(function(fields){
      $scope.vitals.push(fields)
    })
  }

  $scope.viewVitals = function (vitals) {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/viewVitals.html',
      controller: 'viewVitals',
      resolve: {
        item : function(){
          return vitals;
        }
      }
    })
  }

  var getData = function(){
    $http.get('/patient/getVitals')
    .success(function(result){
      $scope.vitals = result.filter(function (vital){ return vital.vitalsDate !== "0000-00-00 00:00:00" })
    })
  }
}])

medconnect.controller('patientUploads', ['$http', '$scope', '$uibModal', '$window', function($http, $scope, $uibModal, $window){
  $scope.uploads = []
  $scope.init = function(){
    getData()
  }

  $scope.add = function(){
    $scope.item = {}
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/views/addUpload.html',
      controller: 'upload',
      resolve: {
        item : function(){
          return $scope.item
        }
      }
    })
    modalInstance.result.then(function(fields){
      $scope.uploads.push(fields)
    })
  }

  $scope.viewUpload = function (upload) {
     $window.open(upload.filePath)
  }

  var getData = function(){
    $http.get('/patient/getUploads')
      .success(function(result){
        $scope.uploads = result
      })
  }
}])

}());
