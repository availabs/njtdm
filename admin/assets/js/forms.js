$(function(){
    function pageLoad(){
       
        //teach select2 to accept data-attributes
        $(".chzn-select").each(function(){
            $(this).select2($(this).data());
        });
        
        
        console.log('acs success');
    }
    console.log('forms');
    pageLoad();
    PjaxApp.onPageLoad(pageLoad);
});