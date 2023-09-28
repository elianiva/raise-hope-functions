import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import * as functions from "firebase-functions";
import {
  institutionRegistrationSchema,
  volunteerRegistrationSchema,
} from "./schemas";
import * as serviceAccount from "../account-private-key.json";
import { z } from "zod";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

exports.registerVolunteer = functions.https.onCall(async (data) => {
  try {
    const schema = volunteerRegistrationSchema.extend({
      password: z.string(),
    });

    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0].message,
      };
    }

    const { password, ...volunteer } = parsed.data;

    // create the user
    const user = await getAuth().createUser({
      email: volunteer.email,
      password: password,
      displayName: volunteer.name,
      // TODO: sanitize phone number to comply with E.164
    });

    functions.logger.info(`user(volunteer) created: ${user.uid}`, {
      structuredData: true,
    });

    // set custom claims on the user
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "volunteer",
    });

    // store additional data in the database
    await admin
      .firestore()
      .collection("volunteers")
      .doc(user.uid)
      .set(volunteer);

    const token = await admin.auth().createCustomToken(user.uid);

    return {
      message: "Volunteer created successfully",
      uuid: user.uid,
      email: user.email,
      role: "volunteer",
      token,
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error;
    return {
      error: message,
    };
  }
});

exports.registerInstitution = functions.https.onCall(async (data) => {
  try {
    const schema = institutionRegistrationSchema.extend({
      password: z.string(),
    });

    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0].message,
      };
    }

    const { password, ...institution } = parsed.data;

    // create the user
    const user = await getAuth().createUser({
      email: institution.email,
      password: password,
      displayName: institution.name,
      // TODO: sanitize phone number to comply with E.164
    });

    functions.logger.info(`user(institution) created: ${user.uid}`, {
      structuredData: true,
    });

    // set custom claims on the user
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "institution",
    });

    // store additional data in the database
    await admin
      .firestore()
      .collection("institutions")
      .doc(user.uid)
      .set(institution);

    const token = await admin.auth().createCustomToken(user.uid);

    return {
      message: "Institution created successfully",
      uuid: user.uid,
      email: user.email,
      role: "institution",
      token,
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : error;
    return {
      error: message,
    };
  }
});

exports.registerVolunteerWithCurrentUser = functions.https.onCall(
  async (data, context) => {
    try {
      const parsed = volunteerRegistrationSchema.safeParse(data);

      if (!parsed.success) {
        return {
          error: parsed.error.issues[0].message,
        };
      }

      if (context.auth === null) {
        return {
          error: "User is not authenticated",
        };
      }

      const user = await admin.auth().getUser(context.auth!.uid);

      await admin.auth().setCustomUserClaims(user.uid, {
        role: "volunteer",
      });

      // store additional data in the database
      await admin
        .firestore()
        .collection("volunteers")
        .doc(user.uid)
        .set(parsed.data);

      return {
        message: "Volunteer created successfully",
        uuid: user.uid,
        email: user.email,
        role: "volunteer",
        error: null,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : error;
      return {
        error: message,
      };
    }
  }
);

exports.registerInstitutionWithCurrentUser = functions.https.onCall(
  async (data, context) => {
    try {
      const parsed = institutionRegistrationSchema.safeParse(data);

      if (!parsed.success) {
        return {
          error: parsed.error.issues[0].message,
        };
      }

      if (context.auth === null) {
        return {
          error: "User is not authenticated",
        };
      }

      const user = await admin.auth().getUser(context.auth!.uid);

      await admin.auth().setCustomUserClaims(user.uid, {
        role: "institution",
      });

      // store additional data in the database
      await admin
        .firestore()
        .collection("institutions")
        .doc(user.uid)
        .set(parsed.data);

      return {
        message: "Institution created successfully",
        uuid: user.uid,
        email: user.email,
        role: "institution",
        error: null,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : error;
      return {
        error: message,
      };
    }
  }
);

exports.userDetails = functions.https.onCall(async (data, context) => {
  // check if the user is authenticated
  if (!context.auth) {
    return {
      error: "User is not authenticated",
    };
  }

  // get the user details
  const user = await admin.auth().getUser(context.auth.uid);

  // get the user role
  const role = user.customClaims?.role || "volunteer";

  // get the user details from the database
  const userDetails = await admin
    .firestore()
    .collection(role + "s")
    .doc(context.auth.uid)
    .get();

  return {
    ...user,
    ...userDetails.data(),
  };
});
