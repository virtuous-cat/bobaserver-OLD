"29d1b2da-3289-454a-9089-2ed47db4967b",
  "posts": [
    {
      "id": "11b85dac-e122-40e0-b09a-8829c5e0250e",
      "parent_thread_id": 1,
      "parent_post_id": null,
      "created": "2020-04-30T03:23:00",
      "content": "[{\"insert\":\"Favorite character to maim?\"}]",
      "type": "text",
      "whisper_tags": null,
      "anonymity_type": "strangers",
      "comments": null,
      "secret_identity": {
        "name": "Evil Moth",
        "avatar": null
      }
    },

    https://board-test.boba.social/gore.png


INSERT INTO Boards(slug, tagline, avatar_reference_id, settings)
VALUES
    ('main_street', 'For BobaBoard-related discussions.', 'https://board-test.boba.social/villains.png', '{ "accentColor": "#ff5252" }'),
    ('gore', 'Blood! Blood! Blood!', 'https://board-test.boba.social/gore.png', '{ "accentColor": "#f96680" }'),
    ('anime', 'I wish I had a funny one for this.', 'https://board-test.boba.social/anime.png', '{ "accentColor": "#24d282"}');


INSERT INTO Users(firebase_id, username, avatar_reference_id, invited_by)
VALUES
    ('9shqqrXpFpNVXy4lkN4MZIlU2ZG3', 'panpinecone', 'https://pbs.twimg.com/profile_images/627424894293278720/ygGnmr8J_400x400.png', NULL);

    SELECT 
       users.id as user_id,
       identity_id
     FROM users
     LEFT JOIN user_thread_identities as uti
      ON users.id = uti.user_id AND uti.thread_id = 3
     LEFT JOIN secret_identities 
      ON secret_identities.id = uti.identity_id
     WHERE 
      firebase_id = 'c6HimTlg2RhVH3fC1psXZORdLcx2'
     LIMIT 1

     SELECT 
          id as secret_identity_id 
         FROM secret_identities
         LEFT JOIN user_thread_identities as uti
         ON secret_identities.id = uti.user_id AND uti.thread_id = 3
         WHERE uti.thread_id = NULL
         ORDER BY RANDOM()
         LIMIT 1