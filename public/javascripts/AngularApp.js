var app = angular.module('FourSquareApp', ['googlechart','ngRoute','ngResource', 'ui.bootstrap']);

app.config(function($routeProvider){
	$routeProvider.when("/explore", {
		controller: "placesExplorerController",
		templateUrl: "/placesresults.html"
	})
	.when("/tips",{
		controller: "tipsController",
		templateUrl: "/tips.html"
	});
	$routeProvider.otherwise({ redirectTo: "/explore"}); 
});

/*******************************CONTROLLERS********************************/
/**************************************************************************/
app.controller('placesExplorerController', function($scope, placesExplorerService, placesPhotosService, tipsService, $filter, $modal){
	// alert('Places Explorer Controller');
	console.log('Places Explorer Controller called ...');
	$scope.exploreNearby = "San Francisco";
	$scope.exploreQuery = "";
	$scope.filterValue = "";

	$scope.places = [];
	$scope.filteredPlaces = [];
	$scope.filteredPlacesCount = 0;

	//paging
	$scope.totalRecordsCount = 0;
	$scope.pageSize = 10;
	$scope.currentPage = 1;

	init();

	function init(){
		createWatch();
		getPlaces();
	}

	function getPlaces(){
		var offset = ($scope.pageSize)*($scope.currentPage - 1);
		placesExplorerService.get({near: $scope.exploreNearby, query: $scope.exploreQuery, limit: $scope.pageSize, offset: offset}, function(placesResult){
			// alert('Getting Places ...');
			if(placesResult.response.groups){
				console.log('Response ...');
				console.log(placesResult.response);
				$scope.places = placesResult.response.groups[0].items;
				$scope.totalRecordsCount = placesResult.response.totalResults;
				filterPlaces('');
			} else { 
				console.log('Response ...');
				console.log(placesResult.response);
				$scope.places = [];
				$scope.totalRecordsCount = 0;
			}
		},function(err){
			console.log("Error ...");
			console.log(err);
		});
	}

	function filterPlaces(filterInput){
		$scope.filteredPlaces = $filter("placesNameCategoryFilter")($scope.places, filterInput);
		$scope.filteredPlacesCount = $scope.filteredPlaces.length;
	}

	function createWatch(){
		$scope.$watch("filterValue", function(filterInput){
			filterPlaces(filterInput);
		});
	}

	$scope.doSearch = function(){
		$scope.currentPage = 1;
		getPlaces();
	};

	$scope.pageChanged = function(page){
		$scope.currentPage = page;
		getPlaces();
	};

	$scope.buildCategoryIcon = function(icon){
		// console.log('Building category icon ...');
		// console.log(icon);
		return icon.prefix + '44' + icon.suffix;
	};

	$scope.buildVenueThumbnail = function(photo){
		// console.log('Photo URL: ');
		// console.log(photo);
		return photo.items[0].prefix + '128x128' + photo.items[0].suffix;
	};

	$scope.showVenuePhotos = function(venueId, venueName){
		placesPhotosService.get({venueId: venueId}, function(photoResult){
			var modalInstance = $modal.open({
				templateUrl: '/placesphotos.html',
				controller: 'placesPhotosController',
				resolve: {
							venueName: function(){
								return venueName;
						 	},
							venuePhotos: function(){
								return photoResult.response.photos.items;
						 	}
						 }
				});
			modalInstance.result.then(function(){
			}, function(){});
		});
	};

	$scope.showTips = function(venueId){
		var modalInstance = $modal.open({
			templateUrl: '/tips.html',
			controller: 'tipsController',
			resolve: {
						venueId: function(){
							return venueId;
						}
			}
		});
		modalInstance.result.then(function(){}, function(){});
	};
});

/*****PLACES PHOTOS CONTROLLER*****/
app.controller('placesPhotosController', function($scope, $modalInstance, venueName, venuePhotos){
	console.log('Photos controller called ...');
	$scope.venueName = venueName;
	$scope.venuePhotos = venuePhotos;

	$scope.close = function(){
		$modalInstance.dismiss('cancel');
	};

	$scope.buildVenuePhoto = function(photo){
		return photo.prefix + '256x256' + photo.suffix;
	};
});
/****************END PHOTOS CONTROLLER******************/

/************TIPS CONTROLLER*************************/
app.controller('tipsController',  function($scope, venueId, tipsService){
	// alert('tipsController called ...');
	$scope.tips = [];
	$scope.venueId = venueId;
	$scope.graphInput = {
		"Mon":0,
		"Tue":0,
		"Wed":0,
		"Thu":0,
		"Fri":0,
		"Sat":0,
		"Sun":0
	};
var weekday = new Array(7);
weekday[0]=  "Sun";
weekday[1] = "Mon";
weekday[2] = "Tue";
weekday[3] = "Wed";
weekday[4] = "Thu";
weekday[5] = "Fri";
weekday[6] = "Sat";


//VenueID : 40a55d80f964a52020f31ee3
	$scope.getTipsByVenue = function(venueId){
	 console.log('Getting tips ...');
		tipsService.get({venueId: venueId}, function(tipsResult){
			console.log(tipsResult);
			$scope.tips = tipsResult.response.tips.items;
			console.log('tips array');
			console.log($scope.tips);
			updateGraphVars($scope.tips);
			console.log('Graph Vars :');
			console.log($scope.graphInput);
			buildGraph();
		});
	};
$scope.getTipsByVenue($scope.venueId);
	function updateGraphVars(tips){
		for(var i=0;i<tips.length;i++){
			var date = new Date(tips[i].createdAt);
			// console.log(date.getDay());
			$scope.graphInput[weekday[date.getDay()]]++;
		}
	}

	function buildGraph(){
		console.log('Building graph ...');
		for(var i=0; i<weekday.length;i++){
			// console.log('for index: ' + i);
			$scope.chart.data["rows"].push(makeChartElement(weekday[i], $scope.graphInput[weekday[i]]));
		}
		// console.log($scope.chart);
	}

	function makeChartElement(day, numOfVisitors){
		console.log('Making chart for ...');
		console.log(day + ' : ' + numOfVisitors);
		var chartBar = {};
		chartBar["c"] = [];
		var chartDayElement = {};
		var chartBarElement = {};
		chartDayElement["v"] = day;
		console.log('day element');
		console.log(chartDayElement)
		chartBar["c"].push(chartDayElement);
		console.log(chartBar);
		chartBarElement["v"] = numOfVisitors;
		chartBar["c"].push(chartBarElement);
		console.log("Chart Bar ...");
		console.log(chartBar);
		return chartBar;
	}

	$scope.chart = {
  "type": "ColumnChart",
  "displayed": true,
  "data": {
    "cols": [
      {
        "id": "day",
        "label": "Day",
        "type": "string"
      },
      {
      	"id": "numOfVisitors",
      	"label": "Visitors",
      	"type": "number"
      }
    ],
    "rows": [
      // {
      //   "c": [
      //     {"v": "Monday"},
      //     {"v": 10}
      //   ]
      // },
      // {
      //   "c": [
      //     {"v": "Tuesday"},
      //     {"v": 23}
      //   ]
      // },
      // {
      //   "c": [
      //     {"v": "Wednesday"},
      //     {"v": 49}
      //   ]
      // }
    ]
  },
  "options": {
    "title": "Visitors by Day of the Week",
    "height": 240,
    "isStacked": "true",
    "fill": 10,
    "displayExactValues": true,
    "vAxis": {
      "title": "Visitors",
      "gridlines": {
        "count": 5
      }
    },
    "hAxis": {
      "title": "Day of the Week"
    }
  },
  "formatters": {}
}
});
/***************************************************/
var requestParams = {
	clientId: "",
    clientSecret: "",
    version: "20131230"
};

/****************SERVICES***********************************/
app.factory('placesExplorerService', function($resource){
	var requestUrl = "https://api.foursquare.com/v2/venues/:action";
	var Resource =  $resource(requestUrl, 
		{	
			action: 'explore',
			client_id: requestParams.clientId,
			client_secret: requestParams.clientSecret,
			v: requestParams.version,
			venuePhotos: '1',
			callback: 'JSON_CALLBACK'
		}, 
		{
			get: {method: 'JSONP'}
		});
	return Resource;
});

app.factory('placesPhotosService', function($resource){
	var requestUrl = 'https://api.foursquare.com/v2/venues/:venueId/:action';
	console.log('Places photos service called ...');
	var Resource = $resource(requestUrl, 
		{
			action: 'photos',
			client_id: requestParams.clientId,
			client_secret: requestParams.clientSecret,
			v: requestParams.version,
			limit: '9',
			callback: 'JSON_CALLBACK'
		}, 
		{
			get: { method: 'JSONP'}
		});
	return Resource;
});

/*TIPS SERVICE*/
app.factory('tipsService', function($resource){
	// alert('Tips SERVICE called ..');
	var requestUrl = 'https://api.foursquare.com/v2/venues/:venueId/:action';
	var Resource = $resource(requestUrl, 
		{
			action: 'tips',
			client_id: requestParams.clientId,
			client_secret: requestParams.clientSecret,
			v: requestParams.version,
			limit: '100',
			callback: 'JSON_CALLBACK'
		}, 
		{
			get: { method: 'JSONP'}
		});
	return Resource;
});
/*TIPS SERVICE END*/

app.filter("placesNameCategoryFilter", function(){
	return function(places, filterValue){
		if(!filterValue) return places;

		var matches = [];
		filterValue = filterValue.toLowerCase();
		for(var i=0; i<places.length; i++){
			var place = places[i];

			if(place.venue.name.toLowerCase().indexOf(filterValue) > -1
				|| place.venue.categories[0].shortName.toLowerCase().indexOf(filterValue) > -1){
				matches.push(place);
			}
		}
	};
});

/************CUSTOM DIRECTIVE ***************/
app.directive("fsUnique", function (placesDataService) {

        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                element.bind('blur', function (e) {
                    if (!ngModel || !element.val()) return;
                    
                    var currentValue = element.val();
                    placesDataService.userExists(currentValue)
                        .then(function (userExists) {
                            var unique = !(userExists === 'true');
                            if (currentValue === element.val()) {
                                ngModel.$setValidity('unique', unique);
                            }
                        }, function () {
                            
                            ngModel.$setValidity('unique', true);
                        });
                });
            }
        }
});
