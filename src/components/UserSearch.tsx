import React, { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  or,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface UserSearchProps {
  onSelectUser: (user: User) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim() || !currentUser) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Searching for users with term:", searchTerm);
      const usersRef = collection(db, "users");

      // Get all users for development - in production you would use a more refined query
      const q = query(usersRef, limit(10));
      const querySnapshot = await getDocs(q);

      const results: User[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        // Filter out the current user
        if (userData.uid !== currentUser.uid) {
          // Manually filter results since we're getting all users
          if (
            userData.email?.includes(searchTerm) ||
            userData.displayName?.includes(searchTerm)
          ) {
            results.push(userData);
          }
        }
      });

      console.log("Search results:", results);
      setSearchResults(results);

      if (results.length === 0) {
        setError("No users found matching your search");
      }
    } catch (error) {
      console.error("Error searching for users:", error);
      setError("An error occurred while searching for users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for users by email..."
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}

      <div className="search-results">
        {searchResults.length > 0 ? (
          <ul>
            {searchResults.map((user) => (
              <li
                key={user.uid}
                onClick={() => onSelectUser(user)}
                className="user-item"
              >
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} />
                  ) : (
                    <div className="default-avatar">
                      {(user.displayName || user.email || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <h4>{user.displayName || "User"}</h4>
                  <p>{user.email}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          searchTerm.trim() && !loading && !error && <p>No users found</p>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
