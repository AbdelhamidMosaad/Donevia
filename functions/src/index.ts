
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { google } from "googleapis";
import * as cors from "cors";

admin.initializeApp();

const corsHandler = cors({ origin: true });

const oauth2Client = new google.auth.OAuth2(
  functions.config().google.client_id,
  functions.config().google.client_secret,
  functions.config().google.redirect_uri
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events.readonly", "https://www.googleapis.com/auth/calendar.events"];

export const getAuthUrl = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: 'consent',
    });
    res.send({ url: authUrl });
  });
});

export const oauthCallback = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const code = req.query.code as string;
    const uid = req.query.state as string; 

    if (!uid) {
      res.status(400).send("No user ID provided in state.");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      const { access_token, refresh_token, expiry_date, scope } = tokens;

      if (!access_token || !expiry_date) {
        throw new Error("Failed to retrieve access token.");
      }

      const tokenData = {
        userId: uid,
        accessToken: access_token,
        expiryDate: expiry_date,
        scope: scope,
        ...(refresh_token && { refreshToken: refresh_token }), 
      };
      
      await admin.firestore()
        .collection('users')
        .doc(uid)
        .collection('googleAuthTokens')
        .doc('primary')
        .set(tokenData, { merge: true });

      res.send("<html><body><h1>Authentication successful!</h1><p>You can close this window.</p></body></html>");
    } catch (error: any) {
      console.error("Error exchanging code for tokens", error);
      res.status(500).send(`Authentication failed: ${error.message}`);
    }
  });
});

export const refreshAccessToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = context.auth.uid;
  const tokenDocRef = admin.firestore().collection('users').doc(uid).collection('googleAuthTokens').doc('primary');
  
  const tokenDoc = await tokenDocRef.get();

  if (!tokenDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'No refresh token found for this user.');
  }

  const { refreshToken } = tokenDoc.data() as { refreshToken?: string };

  if (!refreshToken) {
    throw new functions.https.HttpsError('failed-precondition', 'User has not granted offline access.');
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const { access_token, expiry_date } = credentials;

    if (!access_token || !expiry_date) {
      throw new Error('Failed to refresh access token.');
    }

    await tokenDocRef.update({
      accessToken: access_token,
      expiryDate: expiry_date,
    });

    return { success: true, accessToken: access_token, expiryDate: expiry_date };
  } catch (error: any) {
    console.error('Error refreshing access token:', error);
    throw new functions.https.HttpsError('internal', 'Unable to refresh access token.', error.message);
  }
});
