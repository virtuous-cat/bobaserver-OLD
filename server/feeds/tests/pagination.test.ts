import { BOBATAN_USER_ID } from "test/data/auth";
import { LONG_BOARD_ID } from "test/data/boards";
import { getBoardActivityByUuid } from "../queries";

describe("Tests boards queries", () => {
  test("fetches first page, gets cursor back", async () => {
    const boardActivity = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor: null,
    });

    if (boardActivity === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    expect(boardActivity.cursor).toBe(
      "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMTVUMDU6NDI6MDAuMDAwMDAwIiwicGFnZV9zaXplIjoxMH0="
    );
    expect(boardActivity.activity.length).toEqual(10);
    expect(boardActivity.activity[0].content).toEqual(
      '[{"insert":"Post 26!"}]'
    );
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).toEqual('[{"insert":"Post 17!"}]');
  });

  test("fetches second page, gets cursor back", async () => {
    const boardActivity = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMTVUMDU6NDI6MDAuMDAwMDAwIiwicGFnZV9zaXplIjoxMH0=",
    });

    if (boardActivity === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    expect(boardActivity.cursor).toBe(
      "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMDVUMDU6NDI6MDAuMDAwMDAwIiwicGFnZV9zaXplIjoxMH0="
    );
    expect(boardActivity.activity.length).toEqual(10);
    expect(boardActivity.activity[0].content).toEqual(
      '[{"insert":"Post 16!"}]'
    );
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).toEqual('[{"insert":"Post 7!"}]');
  });

  test("fetches last page, gets no cursor back", async () => {
    const boardActivity = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMDVUMDU6NDI6MDAuMDAwMDAwIiwicGFnZV9zaXplIjoxMH0=",
    });

    if (boardActivity === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    expect(boardActivity.cursor).toBeNull();
    expect(boardActivity.activity.length).toEqual(6);
    expect(boardActivity.activity[0].content).toEqual('[{"insert":"Post 6!"}]');
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).toEqual('[{"insert":"Post 1!"}]');
  });

  test("fetches correctly when only one result after current page", async () => {
    const boardActivity = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMTBUMDU6NDI6MDAiLCJwYWdlX3NpemUiOjEwfQ==",
    });

    if (boardActivity === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    expect(boardActivity.activity.length).toEqual(10);
    expect(boardActivity.activity[0].content).toEqual(
      '[{"insert":"Post 11!"}]'
    );
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).toEqual('[{"insert":"Post 2!"}]');

    const boardActivity2 = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor: boardActivity.cursor,
    });

    if (boardActivity2 === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    expect(boardActivity2.activity.length).toEqual(1);
    expect(boardActivity2.activity[0].content).toEqual(
      '[{"insert":"Post 1!"}]'
    );
  });

  it("fetches correctly when no result after current page (outdated cursor)", async () => {
    const boardActivity = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMTktMDQtMTBUMDU6NDI6MDAiLCJwYWdlX3NpemUiOjEwfQ==",
    });

    if (boardActivity === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    expect(boardActivity.cursor).toBeNull();
    expect(boardActivity.activity.length).toEqual(0);
  });

  test("fetches correctly when post includes microseconds", async () => {
    // This is to guard against the reintroduction of a bug that caused
    // posts to not be returned when the timestamp of their creation included
    // microseconds.
    const boardActivityCursor = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor: undefined,
      pageSize: 5,
    });

    if (boardActivityCursor === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    // This is the last post before the one with an activity that includes microseconds.
    // The cursor returned will include the timestamp of the next post as the
    // cursor to begin fetching the subsequent ones in the next query. The bug in
    // the previous implementation caused the following post, the one with microseconds, to be
    // skipped. To understand why note that timestamp + microseconds always occurs after timestamp,
    // unless microseconds is 0. Since the last activity cursor didn't include microseconds, posts
    // at the border would be considered older than themselves and not fetched with their cursor.
    expect(boardActivityCursor.activity[4].content).toEqual(
      '[{"insert":"Post 22!"}]'
    );

    const boardActivity = await getBoardActivityByUuid({
      boardId: LONG_BOARD_ID,
      // Bobatan
      firebaseId: BOBATAN_USER_ID,
      cursor: boardActivityCursor.cursor,
    });

    if (boardActivity === false) {
      throw Error("Board activity fetching encountered an Error.");
    }

    // Expect the next returned post to be the correct one and have microseconds.
    expect(boardActivity.activity[0].content).toEqual(
      '[{"insert":"Post 21 (with microseconds)!"}]'
    );
  });
});
