import React, { useState, useRef, useEffect } from "react";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../contexts/AuthContext";
import "./UserSearch.css";

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
  const [showResults, setShowResults] = useState(false);
  const { currentUser } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim() || !currentUser) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(true);

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(10));
      const querySnapshot = await getDocs(q);

      const results: User[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        if (userData.uid !== currentUser.uid) {
          if (
            userData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.displayName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) {
            results.push(userData);
          }
        }
      });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() === "") {
      setShowResults(false);
      setError(null);
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.style.display = "none";
    const fallbackEl = e.currentTarget.nextElementSibling;
    if (fallbackEl) {
      fallbackEl.setAttribute("style", "display: flex;");
    }
  };

  const getInitials = (user: User): string => {
    if (user.displayName && user.displayName.trim() !== "") {
      return user.displayName[0].toUpperCase();
    } else if (user.email && user.email.trim() !== "") {
      return user.email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <div className="userSearch" ref={searchRef}>
      <form onSubmit={handleSearch} className="searchForm">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Search users..."
          className="searchInput"
          onClick={() => {
            if (searchTerm.trim() !== "" && searchResults.length > 0) {
              setShowResults(true);
            }
          }}
        />
        <button type="submit" className="searchButton" disabled={loading}>
          {loading ? (
            <div className="spinnerContainer">
              <div className="spinner"></div>
            </div>
          ) : (
            <i className="fa-solid fa-magnifying-glass"></i>
          )}
        </button>
      </form>

      {showResults && (
        <div className="searchResults">
          {error ? (
            <div className="searchError">{error}</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((user) => (
                <li
                  key={user.uid}
                  onClick={() => {
                    onSelectUser(user);
                    setSearchResults([]);
                    setShowResults(false);
                    setSearchTerm("");
                    setError(null);
                  }}
                  className="userItem"
                >
                  <div className="userAvatar">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        onError={(e) => handleImageError(e)}
                      />
                    )}
                    <div
                      className="defaultAvatar"
                      style={{ display: user.photoURL ? "none" : "flex" }}
                    >
                      {getInitials(user)}
                    </div>
                  </div>
                  <div className="userInfo">
                    <h4>{user.displayName || "User"}</h4>
                    <p>{user.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !loading &&
            searchTerm.trim() && (
              <div className="noUsersFound">No users found</div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
