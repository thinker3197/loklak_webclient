'use strict';
/* global angular, L */
/* jshint unused:false */

var controllersModule = require('./_index');
var Leaflet = require('../components/leaflet');
var GeoJSON = require('../components/geojson');
var result;
var marker=[];
/**
 * @ngInject
 */

 controllersModule.controller('AnalyzeCtrl', ['$rootScope','$http','$scope','AppSettings', function($rootScope,$http,$scope,AppSettings) {


    
    //View handling
    $('#analyze-modal').modal('show');
    $('#loader').hide();
    $('#notfoundmessage').hide();

    var chart1 = {};
    chart1.type = "GeoChart";
    chart1.data = [
        ['Locale', 'Count', 'Percent'],
        ['Tunisia' , 0 , 0]

    ];

    chart1.options = {
      width: 1024,
      chartArea: {left:10,top:10,bottom:0,width:"100%"},
      colorAxis: {colors: ['#aec7e8', '#1f77b4']},
      displayMode: 'regions'
    };

    chart1.formatters = {
     number : [{
       columnNum: 1,
       pattern: "# #,##0.00 %"
     }]
    };

    $scope.chart = chart1;
    $scope.username;
    $scope.influentialfollowers=[];
    var counter=0;
    
     $scope.getstatfollower=function()
     {
        console.log("yepbuddy");
        
        
    
        $('#notfoundmessage').hide();
        $('#loader').show(); 
        $http.jsonp(AppSettings.apiUrl+"user.json?callback=JSON_CALLBACK", {params : { screen_name :$scope.username, followers : 20000  } })
            .success(function(data, status, headers, config) {
                

                if(!data.user)
                {
                    $('#loader').hide();
                    $('#notfoundmessage').show();
                    return 0;

                }
                //data about the user analysing
                var topology = data.topology;
                var followerstotal=data.user.followers_count;
                $scope.followerstotal=data.user.followers_count;
                $scope.followingstotal=data.user.friends_count;
                $scope.name=data.user.name;
                $scope.profilepicurl=data.user.profile_image_url_https;
                $scope.profilebanner=data.user.profile_background_image_url_https;
                $scope.tweetcount=data.user.statuses_count;

                //data about followers
                var country_stat_result = {};
                var country_Array=[];
                $scope.followers_follower=[];
                var city_stat_result = {};
                var city_Array=[];
                var top5=[];
                var followers_category=[0,0,0,0,0];
                var followerwithloc=0;
                var followerwithcity=0;
                $scope.countryvalues=[];
                $scope.countrylabels=[];
                $scope.cityvalues=[];
                $scope.citylabels=[];
                $scope.citydata=[];
                $scope.countrydata=[];
                //Getting citywise Stats
                data.topology.followers.forEach(function(ele){
                    if(ele.location)
                    {   followerwithcity++;
                        city_Array.push(ele.location);
                        $scope.followers_follower.push ({
                            "followers" : ele.followers_count ,
                            "id_str" : ele.id_str,
                            "name"   : ele.name,
                            "location" : ele.location,
                            "profileimg" : ele.profile_image_url_https,
                            "screenname" : ele.screen_name,
                            "statuses_count" : ele.statuses_count,
                            "following" : ele.friends_count,
                            "profile_banner" : ele.profile_background_image_url_https
                            
                        });

                    }

                });

                //Counting per city
                for(var i = 0; i < city_Array.length; ++i) 
                {
                    if(!city_stat_result[city_Array[i]])
                    city_stat_result[city_Array[i]] = 0;
                    ++city_stat_result[city_Array[i]];
                }
                var citynames = Object.keys( city_stat_result );

                //Populating Data Set
                var cityData=[];
                citynames.forEach(function(ele){
                    var percentage=((city_stat_result[ele]/followerwithcity)*100);
                    percentage=Number(percentage).toFixed(2);
                    $scope.citydata.push({
                        "city" : ele ,
                        "followers" : percentage

                    });
                    
                    if(percentage>0.5)
                    {    
                     $scope.cityvalues.push(percentage);
                     $scope.citylabels.push(ele);
                    }
                    
                });
                getTopfive($scope.citydata);
                
                
                //Getting country wise stats

                 data.topology.followers.forEach(function(ele){
                    if(ele.followers_count<200)
                    {
                        followers_category[0]++;
                    }
                    if(ele.followers_count>200 && ele.followers_count<=500)
                    {
                        followers_category[1]++;
                    }
                    if((ele.followers_count>500 && ele.followers_count<=1000))
                    {
                        followers_category[2]++;
                    }
                    if((ele.followers_count>1000 && ele.followers_count<=10000))
                    {
                        followers_category[3]++;
                    }
                    if((ele.followers_count>=10000))
                    {
                        followers_category[4]++;
                    }

                    if(ele.location_country)
                    {   followerwithloc++;
                        country_Array.push(ele.location_country);
                    }

                });

                 //Counting country wise stats
                for(var i = 0; i < country_Array.length; ++i) {

                    if(!country_stat_result[country_Array[i]])
                    country_stat_result[country_Array[i]] = 0;
                    ++country_stat_result[country_Array[i]];
                }
                console.log(country_stat_result);

                var countrynames = Object.keys( country_stat_result );
                
                //Populating Data Set
               
                countrynames.forEach(function(ele){
                    var percentage=((country_stat_result[ele]/followerwithloc)*100);
                    percentage=Number(percentage).toFixed(2);
                    chart1.data.push(
                        [ele,country_stat_result[ele],percentage]);
                    $scope.countrydata.push({
                        "country" : ele ,
                        "followers" : percentage

                    });
                    if(percentage>1.5)
                    {    
                        $scope.countryvalues.push(percentage);
                        $scope.countrylabels.push(ele);
                    }
                    
                });
             
                $scope.countrydata.sort(function(a, b){return b.followers-a.followers});
                
                
               
                $scope.city_stat_result=city_stat_result;
                $scope.country_stat_result=country_stat_result;

                $scope.categorylabels=["<200" , "200-500" ,"500-1000","1000-10000", "Greater than 10000"];
                $scope.categoryvalues=followers_category;
        
                getTopfive($scope.followers_follower);
                var influencers = $scope.followers_follower.length > 150 ? 150 : $scope.followers_follower.length;
                for(counter=0;counter<influencers;counter++)
                {
                    $scope.influentialfollowers.push($scope.followers_follower[counter]);
                }
                $('#loader').hide(); 

                }).error(function(data, status, headers, config) {
                    
                    
                    $scope.followers_status="Load Failed.Twitter did not respond.";
                

                    
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
            });
        function getTopfive(followers_follower){
            function compare(a,b) {
                if (a.followers > b.followers)
                    return -1;
                if (a.followers < b.followers)
                    return 1;
                return 0;
            }
            followers_follower.sort(compare);
            
        }
 
     
}
$scope.increaseLimit = function(){
    var i;
    for(i=counter;i<counter+5;i++)
        {
            $scope.influentialfollowers.push($scope.followers_follower[counter]);
            counter++;
        }
}
$rootScope.$watch(function() {
            return $rootScope.root.twitterSession;
            }, function(session) {
                if (session) {
                    $scope.getstatfollower();
                    $scope.username=$rootScope.root.twitterSession.screen_name;
                }
                else
                {
                    $('#signupModal').modal('show');
                }
            });

      


}]);
