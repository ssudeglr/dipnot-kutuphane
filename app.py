from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen
import json

from flask import Flask, g, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "library.db"

app = Flask(__name__)
app.config["SECRET_KEY"] = "dipnot-kutuphane-gizli-anahtar"


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db


@app.teardown_appcontext
def close_db(_error: Exception | None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    db = sqlite3.connect(DATABASE_PATH)
    def column_exists(table_name: str, column_name: str) -> bool:
        rows = db.execute(f"PRAGMA table_info({table_name})").fetchall()
        return any(row[1] == column_name for row in rows)

    def add_column_if_missing(table_name: str, column_name: str, column_def: str) -> None:
        if not column_exists(table_name, column_name):
            db.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")

    db.execute(
        """
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            price REAL NOT NULL,
            image_url TEXT NOT NULL,
            description TEXT NOT NULL,
            section TEXT NOT NULL
        )
        """
    )
    add_column_if_missing("books", "category", "TEXT NOT NULL DEFAULT 'Roman'")
    add_column_if_missing("books", "stock", "INTEGER NOT NULL DEFAULT 5")
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        )
        """
    )
    add_column_if_missing("users", "role", "TEXT NOT NULL DEFAULT 'user'")
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            book_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS event_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_name TEXT NOT NULL,
            event_date TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS borrow_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            borrowed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            returned_at TEXT
        )
        """
    )
    book_count = db.execute("SELECT COUNT(*) AS count FROM books").fetchone()[0]
    if book_count == 0:
        seed_books = [
            ("The Great Gatsby", "F. Scott Fitzgerald", 200.0, "https://covers.openlibrary.org/b/id/7222246-L.jpg", "Klasik Amerikan edebiyatinin en sevilen romanlarindan biri.", "bestseller"),
            ("To Kill a Mockingbird", "Harper Lee", 250.0, "https://covers.openlibrary.org/b/id/8228691-L.jpg", "Adalet ve vicdan temalarini etkileyici bir dille anlatir.", "bestseller"),
            ("Pride and Prejudice", "Jane Austen", 230.0, "https://covers.openlibrary.org/b/id/8091016-L.jpg", "Romantik klasikler arasinda unutulmaz bir eser.", "bestseller"),
            ("The Hobbit", "J.R.R. Tolkien", 280.0, "https://covers.openlibrary.org/b/id/6979861-L.jpg", "Fantastik edebiyatin temel taslarindan bir macera.", "bestseller"),
            ("Kurk Mantolu Madonna", "Sabahattin Ali", 180.0, "https://covers.openlibrary.org/b/id/10523339-L.jpg", "Turk edebiyatinin en sevilen psikolojik romanlarindan.", "recommended"),
            ("Tutunamayanlar", "Oguz Atay", 260.0, "https://covers.openlibrary.org/b/id/10523344-L.jpg", "Modern Turk edebiyatinin kult yapitlarindan biri.", "recommended"),
            ("Saatleri Ayarlama Enstitusu", "Ahmet Hamdi Tanpinar", 210.0, "https://covers.openlibrary.org/b/id/10523345-L.jpg", "Toplumsal degisimi mizahi bir dille anlatan guclu roman.", "recommended"),
            ("Ince Memed", "Yasar Kemal", 195.0, "https://covers.openlibrary.org/b/id/10523346-L.jpg", "Anadolu insaninin hikayesini destansi bir anlatimla sunar.", "recommended"),
        ]
        db.executemany(
            """
            INSERT INTO books (title, author, price, image_url, description, section)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            seed_books,
        )
    db.execute("UPDATE books SET category = 'Roman' WHERE category IS NULL OR category = ''")
    db.execute("UPDATE books SET stock = 5 WHERE stock IS NULL OR stock < 0")
    admin_exists = db.execute(
        "SELECT id FROM users WHERE username = ?",
        ("admin",),
    ).fetchone()
    if admin_exists is None:
        db.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("admin", "admin@dipnot.local", generate_password_hash("1234"), "admin"),
        )
    db.commit()
    db.close()


def fetch_openlibrary_cover_url(title: str, author: str) -> str | None:
    query = urlencode({"title": title, "author": author, "limit": 1})
    api_url = f"https://openlibrary.org/search.json?{query}"
    try:
        with urlopen(api_url, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    docs = payload.get("docs", [])
    if not docs:
        return None

    cover_id = docs[0].get("cover_i")
    if not cover_id:
        return None
    return f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"


def fallback_cover_url(title: str) -> str:
    normalized = title.casefold()
    known_covers = {
        "1984": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        "fahrenheit 451": "https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg",
        "simyac": "https://covers.openlibrary.org/b/id/10523341-L.jpg",
        "kürk mantolu madonna": "https://covers.openlibrary.org/b/id/10523339-L.jpg",
        "kurk mantolu madonna": "https://covers.openlibrary.org/b/id/10523339-L.jpg",
        "otostop": "https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg",
        "şeker portakal": "https://covers.openlibrary.org/b/id/11153262-L.jpg",
        "seker portakal": "https://covers.openlibrary.org/b/id/11153262-L.jpg",
    }
    for key, url in known_covers.items():
        if key in normalized:
            return url

    # Last-resort stable placeholder keyed by title.
    safe_title = urlencode({"q": title})[2:]
    return f"https://picsum.photos/seed/{safe_title}/360/540"


def repair_book_images() -> None:
    db = sqlite3.connect(DATABASE_PATH)
    rows = db.execute(
        """
        SELECT id, title, author, image_url
        FROM books
        WHERE image_url LIKE 'static/%' OR image_url = ''
        """
    ).fetchall()

    for book_id, title, author, _image_url in rows:
        cover_url = fetch_openlibrary_cover_url(title, author)
        final_url = cover_url or fallback_cover_url(title)
        db.execute(
            "UPDATE books SET image_url = ? WHERE id = ?",
            (final_url, book_id),
        )
    db.commit()
    db.close()


def get_cart() -> list[int]:
    return session.setdefault("cart", [])


def cart_items_with_total() -> tuple[list[dict[str, Any]], float]:
    cart_ids = get_cart()
    if not cart_ids:
        return [], 0.0

    placeholders = ",".join("?" for _ in cart_ids)
    rows = get_db().execute(
        f"SELECT id, title, author, price, image_url FROM books WHERE id IN ({placeholders})",
        cart_ids,
    ).fetchall()
    row_map = {row["id"]: row for row in rows}

    items: list[dict[str, Any]] = []
    total = 0.0
    for book_id in cart_ids:
        row = row_map.get(book_id)
        if row is None:
            continue
        price = float(row["price"])
        total += price
        items.append(
            {
                "id": row["id"],
                "title": row["title"],
                "author": row["author"],
                "price": price,
                "image_url": row["image_url"],
            }
        )
    return items, total


@app.context_processor
def inject_cart_count() -> dict[str, Any]:
    return {
        "cart_count": len(get_cart()),
        "current_user": session.get("username"),
    }


@app.route("/register", methods=["GET", "POST"])
def register() -> str:
    error = ""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        password_confirm = request.form.get("password_confirm", "")

        if len(username) < 3:
            error = "Kullanici adi en az 3 karakter olmali."
        elif "@" not in email:
            error = "Gecerli bir e-posta girin."
        elif len(password) < 6:
            error = "Sifre en az 6 karakter olmali."
        elif password != password_confirm:
            error = "Sifreler eslesmiyor."
        else:
            db = get_db()
            existing = db.execute(
                "SELECT id FROM users WHERE username = ? OR email = ?",
                (username, email),
            ).fetchone()
            if existing is not None:
                error = "Bu kullanici adi veya e-posta zaten kayitli."
            else:
                db.execute(
                    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                    (username, email, generate_password_hash(password)),
                )
                db.commit()
                return redirect(url_for("login", registered=1))
    return render_template("register.html", error=error)


@app.route("/login", methods=["GET", "POST"])
def login() -> str:
    error = ""
    if request.method == "POST":
        username_or_email = request.form.get("username_or_email", "").strip()
        password = request.form.get("password", "")
        user = get_db().execute(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            (username_or_email, username_or_email.lower()),
        ).fetchone()
        if user is None or not check_password_hash(user["password_hash"], password):
            error = "Kullanici bilgileri hatali."
        else:
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            return redirect(url_for("index"))
    return render_template("login.html", error=error)


@app.post("/logout")
def logout():
    session.pop("user_id", None)
    session.pop("username", None)
    return redirect(url_for("index"))


@app.route("/")
def index() -> str:
    query = request.args.get("q", "").strip()
    db = get_db()
    if query:
        pattern = f"%{query}%"
        all_books = db.execute(
            """
            SELECT * FROM books
            WHERE title LIKE ? OR author LIKE ?
            ORDER BY id DESC
            """,
            (pattern, pattern),
        ).fetchall()
    else:
        all_books = db.execute("SELECT * FROM books ORDER BY id DESC").fetchall()

    limited_books = all_books[:8]
    split_index = min(4, len(limited_books))
    bestsellers = limited_books[:split_index]
    recommended = limited_books[split_index:]

    return render_template(
        "index.html",
        bestsellers=bestsellers,
        recommended=recommended,
        query=query,
    )


@app.route("/all-books")
def all_books() -> str:
    books = get_db().execute("SELECT * FROM books ORDER BY id DESC").fetchall()
    return render_template("all_books.html", books=books)


@app.route("/book/<int:book_id>")
def book_detail(book_id: int) -> str:
    book = get_db().execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    if book is None:
        return "Kitap bulunamadi.", 404
    return render_template("book_detail.html", book=book)


@app.post("/cart/add/<int:book_id>")
def add_to_cart(book_id: int):
    exists = get_db().execute("SELECT 1 FROM books WHERE id = ?", (book_id,)).fetchone()
    if exists is not None:
        cart = get_cart()
        cart.append(book_id)
        session["cart"] = cart
    return redirect(request.referrer or url_for("index"))


@app.post("/cart/remove/<int:index>")
def remove_from_cart(index: int):
    cart = get_cart()
    if 0 <= index < len(cart):
        cart.pop(index)
        session["cart"] = cart
    return redirect(url_for("cart"))


@app.route("/cart")
def cart() -> str:
    items, total = cart_items_with_total()
    return render_template("cart.html", items=items, total=total)


@app.post("/checkout")
def checkout():
    if not session.get("user_id"):
        return redirect(url_for("login"))
    session["cart"] = []
    return redirect(url_for("cart", paid=1))


init_db()
repair_book_images()

if __name__ == "__main__":
    app.run(debug=True)
