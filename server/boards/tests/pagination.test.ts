import "mocha";
import { expect } from "chai";

// TODO: make tests more legible by using encodeCursor
import { encodeCursor, getBoardActivityBySlug } from "../queries";

describe("Tests boards queries", () => {
  it("fetches first page, gets cursor back", async () => {
    const boardActivity = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor: null,
    });

    expect(boardActivity.cursor).to.equal(
      "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMTVUMDU6NDI6MDAuMDAwIiwicGFnZV9zaXplIjoxMH0="
    );
    expect(boardActivity.activity.length).to.eql(10);
    expect(boardActivity.activity[0].content).to.eql('[{"insert":"Post 26!"}]');
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).to.eql('[{"insert":"Post 17!"}]');
  });

  it("fetches second page, gets cursor back", async () => {
    const boardActivity = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMTVUMDU6NDI6MDAuMDAwIiwicGFnZV9zaXplIjoxMH0=",
    });

    expect(boardActivity.cursor).to.equal(
      "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMDVUMDU6NDI6MDAuMDAwIiwicGFnZV9zaXplIjoxMH0="
    );
    expect(boardActivity.activity.length).to.eql(10);
    expect(boardActivity.activity[0].content).to.eql('[{"insert":"Post 16!"}]');
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).to.eql('[{"insert":"Post 7!"}]');
  });

  it("fetches last page, gets no cursor back", async () => {
    const boardActivity = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMDVUMDU6NDI6MDAuMDAwIiwicGFnZV9zaXplIjoxMH0=",
    });

    expect(boardActivity.cursor).to.be.null;
    expect(boardActivity.activity.length).to.eql(6);
    expect(boardActivity.activity[0].content).to.eql('[{"insert":"Post 6!"}]');
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).to.eql('[{"insert":"Post 1!"}]');
  });

  it("fetches correctly when only one result after current page", async () => {
    const boardActivity = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMjAtMDQtMTBUMDU6NDI6MDAiLCJwYWdlX3NpemUiOjEwfQ==",
    });

    expect(boardActivity.activity.length).to.eql(10);
    expect(boardActivity.activity[0].content).to.eql('[{"insert":"Post 11!"}]');
    expect(
      boardActivity.activity[boardActivity.activity.length - 1].content
    ).to.eql('[{"insert":"Post 2!"}]');

    const boardActivity2 = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor: boardActivity.cursor,
    });

    expect(boardActivity2.activity.length).to.eql(1);
    expect(boardActivity2.activity[0].content).to.eql('[{"insert":"Post 1!"}]');
  });

  it("fetches correctly when no result after current page (outdated cursor)", async () => {
    const boardActivity = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor:
        "eyJsYXN0X2FjdGl2aXR5X2N1cnNvciI6IjIwMTktMDQtMTBUMDU6NDI6MDAiLCJwYWdlX3NpemUiOjEwfQ==",
    });

    expect(boardActivity.cursor).to.be.null;
    expect(boardActivity.activity.length).to.eql(0);
  });

  it("fetches correctly when post includes milliseconds", async () => {
    // This is to guard against the reintroduction of a bug that caused
    // posts to not be returned when the timestamp of their creation included
    // milliseconds.
    const boardActivityCursor = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor: undefined,
      pageSize: 5,
    });

    // This is the last post before the one with an activity that includes milliseconds.
    // The cursor returned will include the timestamp of the next post as the
    // cursor to begin fetching the subsequent ones in the next query. The bug in
    // the previous implementation caused the following post, the one with milliseconds, to be
    // skipped. To understand why note that timestamp + milliseconds always occurs after timestamp,
    // unless milliseconds is 0. Since the last activity cursor didn't include milliseconds, posts
    // at the border would be considered older than themselves and not fetched with their cursor.
    expect(boardActivityCursor.activity[4].content).to.eql(
      '[{"insert":"Post 22!"}]'
    );

    const boardActivity = await getBoardActivityBySlug({
      slug: "long",
      // Bobatan
      firebaseId: "c6HimTlg2RhVH3fC1psXZORdLcx2",
      cursor: boardActivityCursor.cursor,
    });

    // Expect the next returned post to be the correct one and have milliseconds.
    expect(boardActivity.activity[0].content).to.eql(
      '[{"insert":"Post 21 (with milliseconds)!"}]'
    );
  });
});
