document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, className) {
    messageDiv.textContent = message;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      const activities = await response.json();

      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const heading = document.createElement("h4");
        heading.textContent = name;
        activityCard.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        schedule.innerHTML = "<strong>Schedule:</strong> ";
        schedule.append(document.createTextNode(details.schedule));
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        availability.innerHTML = "<strong>Availability:</strong> ";
        availability.append(document.createTextNode(`${spotsLeft} spots left`));
        activityCard.appendChild(availability);

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        activityCard.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.textContent = "No participants yet";
          emptyMessage.className = "empty-participants";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            participant.className = "participant";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;
            participant.appendChild(participantEmail);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.dataset.activity = name;
            removeButton.dataset.email = email;
            removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
            removeButton.title = `Remove ${email}`;

            const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            deleteIcon.setAttribute("viewBox", "0 0 24 24");
            deleteIcon.setAttribute("aria-hidden", "true");
            deleteIcon.setAttribute("focusable", "false");
            const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            iconPath.setAttribute(
              "d",
              "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"
            );
            deleteIcon.appendChild(iconPath);
            removeButton.appendChild(deleteIcon);
            participant.appendChild(removeButton);
            participantsList.appendChild(participant);
          });
        }
        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) {
      return;
    }

    removeButton.disabled = true;
    const { activity, email } = removeButton.dataset;
    const query = new URLSearchParams({ email });

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?${query}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to remove participant");
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage(error.message || "Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
      removeButton.disabled = false;
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
