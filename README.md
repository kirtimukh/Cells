# Franky

The deployed branch of **[Cells](https://cells.ubworkshops.com)**.

This repository will only ever contain 1 commit for each major release.


## Infra

![illustration of pubsub](/docs/assets/Cells_Arch.png)

How the cells are generated when the user selects image and clicks upload
1. Image `metadata` - filename, filetype, and filesize - is sent to backend
2. Backend validates, writes to `database`
3. Backend returns `signed_post_url` (which includes image metadata) to client
4. Client uploads image to `s3 bucket`
5. `S3 trigger` adds `metadata` to `queue`
6. `Lambda` is invoked, gets image `metadata`
7. `Lambda` fetches user uploaded image, generates **thumbnail**, **cells**, and writes them to `s3 bucket`
    - Data of combination of **pins**, **rotations**, and **complete solution** is also saved as a **JSON** file
8. `Lambda` notifies server with hook
9. Server fetches **JSON** from `S3`
10. Writes fetched data to `database`
11. Notifies client via `websockets`


## Screencaps

[![Cells](Cells demo)](https://github.com/user-attachments/assets/1b1fc51d-c91f-48b0-8b8f-e63b8149f5af)

<img width="285" height="304" alt="Image" src="https://github.com/user-attachments/assets/0bc01cb3-3ec0-4907-83eb-9804c705917f" />
<img width="259" height="266" alt="Image" src="https://github.com/user-attachments/assets/f80a1dbc-919b-440a-a3e8-145a051cfd3e" />
<img width="212" height="137" alt="Image" src="https://github.com/user-attachments/assets/52134ee1-e21b-46e9-b2a2-cf79d8d5a695" />
<img width="434" height="190" alt="Image" src="https://github.com/user-attachments/assets/57cf5aed-1e8f-4701-a955-9d352619fc60" />
<img width="212" height="90" alt="Image" src="https://github.com/user-attachments/assets/4291bc00-9e1a-4690-8e89-04d693b8c0bf" />
<img width="222" height="78" alt="Image" src="https://github.com/user-attachments/assets/fdfe7929-5bd0-4b0d-95c5-0d105b4f61d3" />
<img width="720" height="450" alt="Image" src="https://github.com/user-attachments/assets/b843c401-0081-41c0-b529-dc62b622780a" />

[![Multiplayer](Multiplayer demo)](https://github.com/user-attachments/assets/65d147e2-fb1c-46e2-93bf-1cac77b94af5)

[![11x11](11x11 demo)](https://github.com/user-attachments/assets/7df12526-52fb-4b18-addb-c7d355647358)
