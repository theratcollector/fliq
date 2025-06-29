function home(){
        window.location.href="../"
    }

    function signUp(){
        window.location.href="../register"
    }
    
    const statusMsg = document.getElementById("statusMsg");

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if(status === "success"){
        tokenField.style.display = "block";
        statusMsg.style.display = "block";
        statusMsg.inerHTML = "Successfully logged in."
    }else if(status === "error"){
        tokenField.style.display = "block";
        statusMsg.style.display = "block";
        statusMsg.inerHTML = "An error occured."
    }

    async function login(){
        try{
            const data = {
                username:document.getElementById("username").value,
                password:document.getElementById("password").value
            }

            const res = await fetch("http://localhost:3000/login", {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(data)
            });

            if(!res){
                console.log("Serverfehler");
                window.location.href = "?status=error";
            }

            const result = await res.json();

            if(result.token){
                localStorage.setItem("token", result.token);
                window.location.href = "../index.html";
            }
        }catch (err){
            console.log("Error: "+err.message);
            window.location.href = "?status=error";
        }
    }