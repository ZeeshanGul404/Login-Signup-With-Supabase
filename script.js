// Find these values in your Supabase project: Project Settings > API.
const SUPABASE_URL = "https://ecwmhvslczublwnrbjas.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_f8pgwM7-KFcpBwnud0hX5g_knOYVAJh";

const authView = document.querySelector("#auth-view");
const signedInView = document.querySelector("#signed-in-view");
const mode = document.body.dataset.authMode;
const form = document.querySelector("#auth-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const submitButton = document.querySelector("#submit-button");
const submitLabel = document.querySelector("#submit-label");
const statusMessage = document.querySelector("#status-message");
const sessionMessage = document.querySelector("#session-message");
const userEmail = document.querySelector("#user-email");
const signoutButton = document.querySelector("#signout-button");

let supabaseClient;

function showMessage(element, message, type = "error") {
  element.textContent = message;
  element.className = `status-message ${type}`;
  element.hidden = false;
}

function clearMessage(element) {
  element.textContent = "";
  element.hidden = true;
  element.className = "status-message";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitLabel.textContent = isLoading
    ? mode === "login"
      ? "Signing in..."
      : "Creating account..."
    : mode === "login"
      ? "Sign in"
      : "Create account";
}

function renderSession(session) {
  const isSignedIn = Boolean(session?.user);
  authView.hidden = isSignedIn;
  signedInView.hidden = !isSignedIn;

  if (isSignedIn) {
    userEmail.textContent = session.user.email || "your account";
  }
}

function displayAuthError(error) {
  const message = error?.message || "Something went wrong. Please try again.";
  showMessage(statusMessage, message);
}

async function initializeAuth() {
  if (!window.supabase) {
    showMessage(
      statusMessage,
      "Supabase could not be loaded. Check your internet connection and refresh.",
    );
    submitButton.disabled = true;
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
    );
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();
    if (error) {
      throw error;
    }

    renderSession(session);
    supabaseClient.auth.onAuthStateChange((_event, updatedSession) => {
      renderSession(updatedSession);
    });
  } catch (error) {
    showMessage(
      statusMessage,
      `Unable to connect to Supabase: ${error.message}`,
    );
    submitButton.disabled = true;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(statusMessage);

  if (!supabaseClient) {
    showMessage(
      statusMessage,
      "Connect your Supabase project first by adding the URL and anon key in script.js.",
    );
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (password.length < 6) {
    showMessage(statusMessage, "Your password must be at least 6 characters.");
    return;
  }

  setLoading(true);
  try {
    if (mode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      if (error) {
        throw error;
      }

      if (data.session) {
        renderSession(data.session);
      } else {
        showMessage(
          statusMessage,
          "Account created. Check your email for a confirmation link, then sign in.",
          "success",
        );
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }

      renderSession(data.session);
    }
  } catch (error) {
    displayAuthError(error);
  } finally {
    setLoading(false);
  }
});

signoutButton.addEventListener("click", async () => {
  if (!supabaseClient) {
    return;
  }

  signoutButton.disabled = true;
  clearMessage(sessionMessage);
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }
    renderSession(null);
  } catch (error) {
    showMessage(sessionMessage, `Unable to sign out: ${error.message}`);
  } finally {
    signoutButton.disabled = false;
  }
});

initializeAuth();
