const loginUser = async () => {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/sessions/login/", {
      method: "POST",
      headers: { "Content-type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ email: email, password: password }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      console.log("Data received: ", data);
      window.location.href = data.redirect;
    } else {
      console.log("Error durante el inicio de sesión:", data);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Invalid credentials!',
      });
    }
  } catch (error) {
    console.error("Hubo un problema con la operación: ", error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Invalid credentials!',
    });
  }
};
document.getElementById("btnLogIn").onclick = loginUser;
