$(function(){
    function pageLoad(){
        
        $('.chzn-select').select2();
        $("#wizard").bootstrapWizard({onTabShow: function(tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index+1;
            var $percent = ($current/$total) * 100;
            var $wizard = $("#wizard");
            $wizard.find('.progress-bar').css({width:$percent+'%'});

            if($current >= $total) {
                $wizard.find('.pager .next').hide();
                $wizard.find('.pager .finish').show();
                $wizard.find('.pager .finish').removeClass('disabled');
            } else {
                $wizard.find('.pager .next').show();
                $wizard.find('.pager .finish').hide();
            }
        }});
        $('#gtfs-select').on('change',function(){
            gtfsID = parseInt($('#gtfs-select').val());
            if(typeof gtfsID === 'number'){
               $.ajax('/gtfs/'+gtfsID+'/routes') 
               .done(function(data) {
                    var routes = {},
                    selected_routes = [];

                    data.forEach(function(route) {

                        $('#routes-select')
                            .append($('<option>', { 
                                value : route.route_id, 
                                text  : route.route_short_name
                            })
                        )
                        routes[route.route_id] = route.route_short_name;
                    });
                    
                    $('#add-route-btn').on('click',function(){
                        selected_routes.push($('#routes-select').val());
                        $('#selected-routes-table').append('<tr><td>'+$('#routes-select').val()+'</td><td>'+routes[$('#routes-select').val()]+'</td><td class="text-right"><button type="button" class="btn btn-sm btn-danger" id="remove-route-btn"><i class="fa fa-minus"></i></button></td></tr>')
                    })
                })
               .fail(function(err) { console.log('/gtfs/'+gtfsID+'/routes error',err); })
            }
        });
    }

    pageLoad();

    PjaxApp.onPageLoad(pageLoad);
});