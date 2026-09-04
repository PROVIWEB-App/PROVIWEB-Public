# Sección Música - Adaptación Android → HTML

Se ha adaptado la lógica de la app Android al proyecto web. Estructura y uso:

## Archivos nuevos

### JS (en `public/js/`)

- **music-player-manager.js**  
  Equivalente a `MusicPlayerManager` en Android:
  - Cola de reproducción, play/pause, siguiente/anterior
  - Shuffle y repeat (off / all / one)
  - Recientes en `localStorage`
  - Uso: `MusicPlayerManager.getInstance()` → `play(song, playlist)`, `togglePlayPause()`, `getQueue()`, etc.
  - Las canciones se normalizan con `audioUrl` y `pId` (compatible con `url`/`userId` del proyecto actual).

- **music-adapters.js**  
  Equivalente a los adapters de RecyclerView en Android; renderizan listas/grids en el DOM:
  - `renderAlbumGrid(container, albumNames, albumsMap, artistId, options)` — grid de álbumes (AdapterAlbumGrid)
  - `renderSongList(container, songList, options)` — lista de canciones (AdapterSong / AdapterAlbumSong)
  - `renderArtistList(container, artistList, options)` — lista de artistas (AdapterArtist)
  - `renderMusicComments(container, commentList, options)` — comentarios (AdapterMusicComment)
  - `renderPlaylistList(container, playlistList, options)` — playlists (AdapterPlaylist)
  - `renderPlaylistFeed(container, playlistList, options)` — playlists con dueño (AdapterPlaylistFeed)

- **music-firebase.js**  
  Helpers que usan las mismas rutas que la app Android:
  - `Songs`, `UserSongs`, `Playlists`, `UserPlaylists`, `SongLikes`, `MusicComments`, `ShareCodes`, `Users`
  - `loadUserSongs()`, `loadAllSongs()`, `loadUserPlaylists()`, `loadPlaylistDetail()`, `loadPlaylistByShareCode()`, `loadArtistSongsAndAlbums()`, `loadMusicComments()`, `loadUser()`
  - Si no hay datos en `Songs`/`UserSongs`, se usa el fallback actual (`AudiosPlay/{uid}`).

### Páginas HTML

- **artist-profile.html?artistId=xxx**  
  Perfil de artista (equivalente a `ArtistProfileActivity`):
  - Datos de usuario desde `Users/{artistId}`
  - Canciones y álbumes: vía `loadArtistSongsAndAlbums` (Android) o `AudiosPlay/{artistId}` (legacy)
  - Lista de canciones + grid de álbumes con los adapters

- **playlist-detail.html?id=xxx** o **?code=XXXXXX**  
  Detalle de playlist (equivalente a `PlaylistDetailActivity`):
  - Si se pasa `code`, se resuelve con `ShareCodes` y se carga la playlist
  - Lista de canciones, “Reproducir todo”, compartir código

### Integración en mymusic.html

- Inclusión de `music-player-manager.js`.
- Mini reproductor fijo abajo que se muestra cuando hay sesión activa (por ejemplo al volver de `song.html`).
- Actualización del mini reproductor con el estado del manager (play/pause, canción actual, enlace a `song.html`).

## Rutas Firebase (compatibles con Android)

| Ruta | Uso |
|------|-----|
| `Songs/{songId}` | Canción global (id, pId, title, artist, album, audioUrl, coverUrl, likeCount, commentCount, playCount, etc.) |
| `UserSongs/{uid}` | Índice de IDs de canciones del usuario |
| `Playlists/{playlistId}` | name, coverUrl, songIds, songCount, shareCode, pId |
| `UserPlaylists/{uid}` | Índice de IDs de playlists del usuario |
| `SongLikes/{songId}/{uid}` | Like (valor o tipo de reacción) |
| `MusicComments/{songId}/{cId}` | comment, id (userId), timestamp, type: "song" |
| `ShareCodes/{code}` | playlistId |
| `Users/{uid}` | name, photo |

Si la base actual usa solo `AudiosPlay/{uid}` y `MusicLikes`/`MusicComments` con `songKey` (`uid_id`), los helpers intentan primero las rutas Android y hacen fallback a esas rutas.

## Uso rápido

1. **Reproducir con cola**  
   En cualquier página que cargue `music-player-manager.js`:
   ```js
   var m = MusicPlayerManager.getInstance();
   m.play(song, list);  // song = { id, url|audioUrl, title, artist, coverUrl, userId|pId }
   ```

2. **Pintar lista de canciones**  
   Donde tengas `db`, `ref`, `onValue` (y opcionalmente `MusicAdapters`):
   ```js
   MusicAdapters.renderSongList(containerElement, songList, { songPageBase: 'song.html' });
   ```

3. **Perfil de artista**  
   Enlace: `artist-profile.html?artistId=UID_DEL_ARTISTA`.

4. **Playlist por código**  
   Enlace: `playlist-detail.html?code=ABCD12`.

5. **Comentarios de una canción**  
   Cargar con `MusicFirebase.loadMusicComments(db, ref, onValue, songId, callback)` y pintar con `MusicAdapters.renderMusicComments(container, list, { loadUser: (uid, cb) => MusicFirebase.loadUser(db, ref, get, uid, cb) })`.

## Próximos pasos posibles

- **song.html**: usar `MusicPlayerManager` para play/pause/siguiente/anterior y cola (como `SongPlayerFullActivity`).
- **Cola (Queue)**: página o panel que muestre `getQueue()` y permita saltar a una canción.
- **Añadir a playlist**: modal que liste `UserPlaylists`, permita elegir playlist y añadir la canción (como `AddToPlaylistBottomSheet`).
- **Crear playlist**: página para crear playlist (nombre, portada, canciones) y guardar en `Playlists`/`UserPlaylists`/`ShareCodes`.
