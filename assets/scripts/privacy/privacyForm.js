document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("policyForm");
    const submitButton = document.querySelector(".policy-form-submit");
    const loadingMessage = document.getElementById("loadingMessage");
  form.addEventListener("submit", async function(event) {
      event.preventDefault();
      submitButton.disabled = true;
      submitButton.innerHTML = "Sending...";
      loadingMessage.style.display = "block";
  // Convert FormData to a JSON object
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
  try {
        const response = await fetch("https://your-api-id.execute-api.region.amazonaws.com/submit-form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
  const result = await response.json();
        console.log("Submission success:", result);
  // Redirect to a Thank You page if needed
        const redirectUrl = formData.get("_next");
        window.location.href = redirectUrl;
  } catch (error) {
        console.error("Error submitting form:", error);
        submitButton.disabled = false;
        submitButton.innerHTML = "Send Message";
        loadingMessage.style.display = "none";
      }
    });
  });
  