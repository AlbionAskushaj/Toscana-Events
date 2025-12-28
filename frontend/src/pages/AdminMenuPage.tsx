import { useEffect, useState } from "react";
import {
  createMenuCategory,
  createMenuItem,
  dedupeMenuItems,
  deleteMenuCategory,
  deleteMenuItem,
  getMenuCategories,
  getMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from "../api";
import { MenuCategory, MenuItem } from "../types";
import { Link } from "react-router-dom";

type CategoryEdit = { name: string; sortOrder: number };
type ItemEdit = {
  categoryId: string;
  name: string;
  description: string;
  pricePerPerson: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  active: boolean;
};

const AdminMenuPage = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoryEdits, setCategoryEdits] = useState<Record<string, CategoryEdit>>({});
  const [itemEdits, setItemEdits] = useState<Record<string, ItemEdit>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [dedupeSummary, setDedupeSummary] = useState<{ totalItems: number; duplicateCount: number } | null>(null);

  const [newCategory, setNewCategory] = useState<CategoryEdit>({ name: "", sortOrder: 0 });
  const [newItem, setNewItem] = useState<ItemEdit>({
    categoryId: "",
    name: "",
    description: "",
    pricePerPerson: 0,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    active: true,
  });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!newItem.categoryId && categories.length > 0) {
      setNewItem((prev) => ({ ...prev, categoryId: categories[0]._id }));
    }
  }, [categories, newItem.categoryId]);

  useEffect(() => {
    const edits: Record<string, CategoryEdit> = {};
    categories.forEach((category) => {
      edits[category._id] = { name: category.name, sortOrder: category.sortOrder };
    });
    setCategoryEdits(edits);
  }, [categories]);

  useEffect(() => {
    const edits: Record<string, ItemEdit> = {};
    items.forEach((item) => {
      edits[item._id] = {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        pricePerPerson: item.pricePerPerson,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isGlutenFree: item.isGlutenFree,
        active: item.active,
      };
    });
    setItemEdits(edits);
  }, [items]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryData, itemData] = await Promise.all([getMenuCategories(), getMenuItems()]);
      setCategories(categoryData);
      setItems(itemData);
    } catch (err) {
      console.error(err);
      setError("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySave = async (id: string) => {
    const edit = categoryEdits[id];
    if (!edit?.name) {
      setError("Category name is required");
      return;
    }
    try {
      await updateMenuCategory(id, edit);
      await load();
      setNotice("Category updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update category");
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm("Delete this category and its items?")) return;
    try {
      await deleteMenuCategory(id);
      await load();
      setNotice("Category deleted");
    } catch (err) {
      console.error(err);
      setError("Failed to delete category");
    }
  };

  const handleCategoryCreate = async () => {
    if (!newCategory.name) {
      setError("Category name is required");
      return;
    }
    try {
      await createMenuCategory(newCategory);
      setNewCategory({ name: "", sortOrder: 0 });
      await load();
      setNotice("Category added");
    } catch (err) {
      console.error(err);
      setError("Failed to create category");
    }
  };

  const handleItemSave = async (id: string) => {
    const edit = itemEdits[id];
    if (!edit?.name || !edit?.categoryId) {
      setError("Item name and category are required");
      return;
    }
    try {
      await updateMenuItem(id, edit);
      await load();
      setNotice("Item updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update item");
    }
  };

  const handleItemDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteMenuItem(id);
      await load();
      setNotice("Item deleted");
    } catch (err) {
      console.error(err);
      setError("Failed to delete item");
    }
  };

  const handleItemCreate = async () => {
    if (!newItem.name || !newItem.categoryId) {
      setError("Item name and category are required");
      return;
    }
    try {
      await createMenuItem(newItem);
      setNewItem({
        categoryId: "",
        name: "",
        description: "",
        pricePerPerson: 0,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        active: true,
      });
      await load();
      setNotice("Item added");
    } catch (err) {
      console.error(err);
      setError("Failed to create item");
    }
  };

  const handleDedupe = async (apply: boolean) => {
    setError("");
    try {
      const result = await dedupeMenuItems(!apply ? true : false);
      setDedupeSummary({ totalItems: result.totalItems, duplicateCount: result.duplicateCount });
      if (apply) {
        await load();
        setNotice("Duplicates removed");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to dedupe items");
    }
  };

  return (
    <div className="container py-4 admin-menu">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h2 className="mb-0">Menu Management</h2>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link className="btn btn-outline-secondary" to="/admin/inquiries">
            Inquiries
          </Link>
          <Link className="btn btn-primary" to="/admin/menu">
            Menu
          </Link>
          <Link className="btn btn-outline-secondary" to="/admin/rooms">
            Rooms
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      {loading && <div className="text-muted">Loading menu data...</div>}

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="h5 mb-0">Duplicates</h3>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-secondary" onClick={() => handleDedupe(false)}>
                Dry Run
              </button>
              <button className="btn btn-primary" onClick={() => handleDedupe(true)}>
                Remove Duplicates
              </button>
            </div>
          </div>
          {dedupeSummary && (
            <p className="text-muted mt-2 mb-0">
              Items scanned: {dedupeSummary.totalItems} · Duplicates found: {dedupeSummary.duplicateCount}
            </p>
          )}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="h5">Categories</h3>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Sort Order</label>
                  <input
                    className="form-control"
                    type="number"
                    value={newCategory.sortOrder}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={handleCategoryCreate}>
                  Add Category
                </button>
              </div>
              <div className="table-responsive mt-3">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Sort</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category._id}>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            value={categoryEdits[category._id]?.name || ""}
                            onChange={(e) =>
                              setCategoryEdits((prev) => ({
                                ...prev,
                                [category._id]: {
                                  ...prev[category._id],
                                  name: e.target.value,
                                },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            value={categoryEdits[category._id]?.sortOrder ?? 0}
                            onChange={(e) =>
                              setCategoryEdits((prev) => ({
                                ...prev,
                                [category._id]: {
                                  ...prev[category._id],
                                  sortOrder: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleCategorySave(category._id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleCategoryDelete(category._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card">
            <div className="card-body">
              <h3 className="h5">Menu Items</h3>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={newItem.name}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Price Per Person</label>
                  <input
                    className="form-control"
                    type="number"
                    value={newItem.pricePerPerson}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, pricePerPerson: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="col-12 col-md-8">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={newItem.description}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Dietary Flags</label>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newItem.isVegetarian}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, isVegetarian: e.target.checked }))}
                        id="new-item-veg"
                      />
                      <label className="form-check-label" htmlFor="new-item-veg">
                        Vegetarian
                      </label>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newItem.isVegan}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, isVegan: e.target.checked }))}
                        id="new-item-vegan"
                      />
                      <label className="form-check-label" htmlFor="new-item-vegan">
                        Vegan
                      </label>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newItem.isGlutenFree}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, isGlutenFree: e.target.checked }))}
                        id="new-item-gf"
                      />
                      <label className="form-check-label" htmlFor="new-item-gf">
                        Gluten Free
                      </label>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newItem.active}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, active: e.target.checked }))}
                        id="new-item-active"
                      />
                      <label className="form-check-label" htmlFor="new-item-active">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={handleItemCreate}>
                  Add Item
                </button>
              </div>

              {categories.map((category) => (
                <div key={category._id} className="mt-4">
                  <h4 className="h6 text-uppercase text-muted">{category.name}</h4>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Flags</th>
                          <th>Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items
                          .filter((item) => item.categoryId === category._id)
                          .map((item) => {
                            const edit = itemEdits[item._id];
                            return (
                              <tr key={item._id}>
                                <td>
                                  <input
                                    className="form-control form-control-sm"
                                    value={edit?.name || ""}
                                    onChange={(e) =>
                                      setItemEdits((prev) => ({
                                        ...prev,
                                        [item._id]: { ...prev[item._id], name: e.target.value },
                                      }))
                                    }
                                  />
                                  <select
                                    className="form-select form-select-sm mt-2"
                                    value={edit?.categoryId || ""}
                                    onChange={(e) =>
                                      setItemEdits((prev) => ({
                                        ...prev,
                                        [item._id]: { ...prev[item._id], categoryId: e.target.value },
                                      }))
                                    }
                                  >
                                    {categories.map((categoryOption) => (
                                      <option key={categoryOption._id} value={categoryOption._id}>
                                        {categoryOption.name}
                                      </option>
                                    ))}
                                  </select>
                                  <textarea
                                    className="form-control form-control-sm mt-2"
                                    value={edit?.description || ""}
                                    onChange={(e) =>
                                      setItemEdits((prev) => ({
                                        ...prev,
                                        [item._id]: { ...prev[item._id], description: e.target.value },
                                      }))
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-control form-control-sm"
                                    type="number"
                                    value={edit?.pricePerPerson ?? 0}
                                    onChange={(e) =>
                                      setItemEdits((prev) => ({
                                        ...prev,
                                        [item._id]: {
                                          ...prev[item._id],
                                          pricePerPerson: Number(e.target.value),
                                        },
                                      }))
                                    }
                                  />
                                </td>
                                <td>
                                  <div className="d-flex flex-column gap-2">
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={edit?.isVegetarian || false}
                                        onChange={(e) =>
                                          setItemEdits((prev) => ({
                                            ...prev,
                                            [item._id]: { ...prev[item._id], isVegetarian: e.target.checked },
                                          }))
                                        }
                                        id={`veg-${item._id}`}
                                      />
                                      <label className="form-check-label" htmlFor={`veg-${item._id}`}>
                                        Veg
                                      </label>
                                    </div>
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={edit?.isVegan || false}
                                        onChange={(e) =>
                                          setItemEdits((prev) => ({
                                            ...prev,
                                            [item._id]: { ...prev[item._id], isVegan: e.target.checked },
                                          }))
                                        }
                                        id={`vegan-${item._id}`}
                                      />
                                      <label className="form-check-label" htmlFor={`vegan-${item._id}`}>
                                        Vegan
                                      </label>
                                    </div>
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={edit?.isGlutenFree || false}
                                        onChange={(e) =>
                                          setItemEdits((prev) => ({
                                            ...prev,
                                            [item._id]: { ...prev[item._id], isGlutenFree: e.target.checked },
                                          }))
                                        }
                                        id={`gf-${item._id}`}
                                      />
                                      <label className="form-check-label" htmlFor={`gf-${item._id}`}>
                                        GF
                                      </label>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={edit?.active || false}
                                      onChange={(e) =>
                                        setItemEdits((prev) => ({
                                          ...prev,
                                          [item._id]: { ...prev[item._id], active: e.target.checked },
                                        }))
                                      }
                                      id={`active-${item._id}`}
                                    />
                                    <label className="form-check-label" htmlFor={`active-${item._id}`}>
                                      Active
                                    </label>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() => handleItemSave(item._id)}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => handleItemDelete(item._id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuPage;
