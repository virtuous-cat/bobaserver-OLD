import { BoardDescription, DbBoardMetadata } from "../../Types";

/**
 * Returns a delta between the old metadata of a Board and the new one.
 */
export const getMetadataDelta = ({
  oldMetadata,
  newMetadata,
}: {
  oldMetadata: Partial<DbBoardMetadata>;
  newMetadata: Partial<DbBoardMetadata>;
}): {
  tagline?: string;
  accentColor?: string;
  texts: {
    deleted: { id: string }[];
    newAndUpdated: BoardDescription[];
  };
  categoryFilters: {
    deleted: { id: string }[];
    newAndUpdated: {
      id: string;
      index: number;
      title: string;
      type: "text" | "category_filter";
      description?: string;
      categories: {
        deleted: string[];
        new: string[];
      };
    }[];
  };
} => {
  const oldTexts = oldMetadata.descriptions.filter(
    (desc) => desc.type == "text"
  );
  const oldCategoryFilters = oldMetadata.descriptions.filter(
    (desc) => desc.type == "category_filter"
  );
  const newTexts = newMetadata.descriptions.filter(
    (desc) => desc.type == "text"
  );
  const newCategoryFilters = newMetadata.descriptions.filter(
    (desc) => desc.type == "category_filter"
  );

  // Deleted texts will be in oldTexts but not newTexts
  const deletedTexts = oldTexts.filter(
    (oldText) => !newTexts.some((newText) => newText.id == oldText.id)
  );
  // There's no special handling needed for new and updated texts.
  const newAndUpdatedTexts = newTexts;

  // Deleted filters will be in oldCategoryFilters but not newCategoryFilters
  const deletedFilters = oldCategoryFilters.filter(
    (oldFilter) =>
      !newCategoryFilters.some((newFilter) => newFilter.id == oldFilter.id)
  );

  const newAndUpdatedFilters = newCategoryFilters.map((newFilter) => {
    const oldFilter = oldCategoryFilters.find(
      (oldFilter) => oldFilter.id == newFilter.id
    );

    // Deleted categories will be in oldFilter's but not newFilter's.
    // If there's no oldFilter, by definition nothing will have been deleted.
    const deletedCategories = oldFilter
      ? oldFilter.categories.filter(
          (oldCategory) =>
            !newFilter.categories.some(
              (newCategory) =>
                oldCategory.toLowerCase() == newCategory.toLowerCase()
            )
        )
      : [];

    // New categories will be in newFilter's but not oldFilter's.
    // If there's no oldFilter, by definition everything will be new
    const newCategories = oldFilter
      ? newFilter.categories.filter(
          (newCategory) =>
            !oldFilter.categories.some(
              (oldCategory) =>
                oldCategory.toLowerCase() == newCategory.toLowerCase()
            )
        )
      : newFilter.categories;

    return {
      ...newFilter,
      categories: {
        deleted: deletedCategories,
        new: newCategories,
      },
    };
  });

  return {
    accentColor:
      oldMetadata.accentColor != newMetadata.accentColor
        ? newMetadata.accentColor
        : undefined,
    tagline:
      oldMetadata.tagline != newMetadata.tagline
        ? newMetadata.tagline
        : undefined,
    texts: {
      deleted: deletedTexts.map((text) => ({ id: text.id })),
      newAndUpdated: newAndUpdatedTexts,
    },
    categoryFilters: {
      deleted: deletedFilters.map((filter) => ({ id: filter.id })),
      // TODO: type this correctly
      // @ts-ignore
      newAndUpdated: newAndUpdatedFilters,
    },
  };
};