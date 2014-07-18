$(function(){
    function pageLoad(){        
        $('.widget').widgster();
    }
    pageLoad();

    PjaxApp.onPageLoad(pageLoad);
});

function UserAdminController ($scope) {
    $scope.users = window.users;
    $scope.newUser = {};
    console.log($scope.users);

    $scope.createAccount = function(){
        io.socket.post('/user/create',$scope.newUser,function serverSays(err,message){
            if (err)
                console.log(err)

            console.log(message);
        });   
    }

};
