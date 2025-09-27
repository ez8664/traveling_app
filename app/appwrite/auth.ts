import { ID, OAuthProvider, Query } from "appwrite";
import { n } from "node_modules/react-router/dist/development/index-react-server-client-BeVfPpWg.mjs";
import { redirect } from "react-router";
import { account, appwriteConfig, database } from "~/appwrite/client";

export const loginWithGoogle = async () => {
  try {
    account.createOAuth2Session(OAuthProvider.Google);
  } catch (e) {
    console.log('loginWithGoogle', e);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession('current');
    return true;
  } catch (e) {
    console.log('logoutUser error:', e);
    return false;
  }
};

export const getUser = async () => {
  try {
    const user = await account.get();

    if (!user) return redirect('/sign-in');

    const { documents } = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [
            Query.equal('accountId', user.$id),
            Query.select(['name', 'email', 'imageUrl', 'joinedAt', 'accountId'])
        ]
    );

    if (documents.length === 0) {
        return await storeUserData();
    }
  } catch (e) {
    console.log('getUser error:', e);
    return null;
  }
};

export const getGooglePicture = async () => {
  try {
    const session = await account.getSession('current');

    const oAuthToken = session.providerAccessToken;

    if (!oAuthToken) {
        console.log('No OAuth token available');
        return null;
    };

    const response = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
            headers: {
                Authorization: `Bearer ${oAuthToken}`,
            },
        }
    );

    if (!response.ok) {
        console.log('Failed to fetch profile photo from Google People API');
    }

    const data = await response.json();

    const photoUrl = data.photos && data.photos.length > 0 ? data.photos[0].url : null;

    return photoUrl;
  } catch (e) {
    console.log('getGooglePicture error:', e)
  }
};

export const storeUserData = async () => {
  try {
    const user = await account.get();

    if (!user) return null;

    const { documents } = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [
            Query.equal('accountId', user.$id)
        ]
    );

    if (documents.length > 0) {
        return documents[0];
    }

    const imageUrl = await getGooglePicture();

    const newUser = await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        ID.unique(),
        {
            accountId: user.$id,
            email: user.email,
            name: user.name,
            imageUrl: imageUrl || '',
            joinedAt: new Date().toISOString()
        }
    );

    return newUser;
  } catch (e) {
    console.log('storeUserData error:', e);
    return null;
  }
};

export const getExistingUser = async () => {
  try {
    const user = await account.get();

    if (!user) return null;

    const { documents } = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [
            Query.equal('accountId', user.$id)
        ]
    );

    if (documents.length === 0) {
        return null;
    }

    return documents[0];
  } catch (e) {
    console.log('getExistingUser error:', e);
    return null;
  }
};