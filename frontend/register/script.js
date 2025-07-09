const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if(status === "success"){
        statusMsg.style.display = "block";
        statusMsg.style.color = "#4CBB17";
        statusMsg.innerHTML = "Account Successfully Created. <a href='../login'>login here</a>";
    }else if(status === "error"){
        statusMsg.style.display = "block";
        statusMsg.textContent = "An error occured. Please try again later";
    }

    function home(){
        window.location.href="../"
    }

    function signUp(){
        window.location.href="../login/"
    }

    async function register(){

        const statusMsg = document.getElementById("statusMsg");
        
        const data = {
            username:document.getElementById("username").value,
            password: document.getElementById("password").value
        }

        if(!data.username || !data.password){
            console.error("Please fill in the required fields");
            statusMsg.style.display = "block";
            statusMsg.textContent = "Please fill in mandatory fields";
            return;
        }

        try{
            const res = await fetch("/register", {
                method:"POST",
                headers: {
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(data)
            });

            if(!res.ok){
                console.log("Internal Sever error.")
                window.location.href="?status=success"
            }

            const result = await res.text();

            if(res.ok && result == "success"){
                window.location.href="?status=success"
            }
        }catch{
            console.error("an error occured. Error Code: 2x6dh");
            window.location.href="?status=error"
        }
    }