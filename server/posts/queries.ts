import debug from "debug";
import pool from "../pool";
import { v4 as uuidv4 } from "uuid";

const log = debug("bobaserver:posts:queries-log");
const error = debug("bobaserver:posts:queries-error");

export const postNewContribution = async ({
  firebaseId,
  replyTo,
  content,
  anonymityType,
}: {
  firebaseId: string;
  replyTo: string;
  content: string;
  anonymityType: string;
}): Promise<any> => {
  try {
    const client = await pool.connect();
    const threadIdQuery = `SELECT parent_thread FROM posts WHERE posts.string_id = $1`;
    const {
      rows: [{ parent_thread }],
    } = await client.query(threadIdQuery, [replyTo]);
    log(firebaseId);
    log(parent_thread);
    const userQuery = `
     SELECT 
       users.id as user_id,
       identity_id
     FROM users
     LEFT JOIN user_thread_identities as uti
      ON users.id = uti.user_id AND uti.thread_id = $2
     LEFT JOIN secret_identities 
      ON secret_identities.id = uti.identity_id
     WHERE 
      firebase_id = $1
     LIMIT 1`;
    const {
      rows: [{ user_id, identity_id }],
    } = await client.query(userQuery, [firebaseId, parent_thread]);

    if (!identity_id) {
      const randomIdentity = `SELECT 
          id as secret_identity_id 
         FROM secret_identities
         LEFT JOIN user_thread_identities as uti
         ON secret_identities.id = uti.identity_id AND uti.thread_id = $1
         WHERE uti.user_id is NULL
         ORDER BY RANDOM()
         LIMIT 1`;
      const {
        rows: [{ secret_identity_id }],
      } = await client.query(randomIdentity, [parent_thread]);

      const createIdentityResult = await client.query(
        `INSERT INTO user_thread_identities(thread_id, user_id, identity_id)
         VALUES($1, $2, $3)`,
        [parent_thread, user_id, secret_identity_id]
      );
    }

    const newPostStringId = uuidv4();
    const query = `
      INSERT INTO posts(string_id, parent_post, parent_thread, author, content, type, whisper_tags, anonymity_type)
      VALUES(
        $1,
        (SELECT id FROM posts WHERE posts.string_id = $2),
        $3,
        $4,
        $5,
        'text',
        NULL,
        $6
      ) RETURNING *`;
    const { rows } = await client.query(query, [
      newPostStringId,
      replyTo,
      parent_thread,
      user_id,
      content,
      anonymityType,
    ]);

    log(`Post insertion successful. Result: `, rows[0]);

    return newPostStringId;
  } catch (e) {
    error(`Error while fetching boards.`);
    error(e);
    return null;
  }
};

export const postNewComment = async ({
  firebaseId: userId,
  replyTo,
  content,
  anonymityType,
}: {
  firebaseId: string;
  replyTo: string;
  content: string;
  anonymityType: string;
}): Promise<any> => {
  const query = `
      INSERT INTO comments(string_id, parent_post, parent_thread, author, content, anonymity_type)
      VALUES(
        $1,
        (SELECT id FROM posts WHERE posts.string_id = $2),
        (SELECT parent_thread FROM posts WHERE posts.string_id = $2),
        $3,
        $4,
        $5
      ) RETURNING *`;

  try {
    const { rows } = await pool.query(query, [
      uuidv4(),
      replyTo,
      userId,
      content,
      anonymityType,
    ]);

    log(`Post insertion successful. Result: `, rows[0]);

    return rows[0];
  } catch (e) {
    error(`Error while fetching boards.`);
    error(e);
    return null;
  }
};
