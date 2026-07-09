using UnityEngine;

// Player now strictly follows the mouse cursor. Keyboard movement removed.
public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 8f;
    private Rigidbody2D rb;
    private Camera mainCam;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        mainCam = Camera.main;
    }

    void Update()
    {
        if (GameManager.Instance != null && GameManager.Instance.IsMovementPaused)
            return;

        if (mainCam == null) return;

        Vector3 mouseWorld = mainCam.ScreenToWorldPoint(Input.mousePosition);
        Vector2 target = new Vector2(mouseWorld.x, mouseWorld.y);

        if (rb != null)
        {
            // use velocity for smoother physics-driven movement if Rigidbody2D present
            Vector2 dir = (target - (Vector2)transform.position);
            rb.velocity = dir.normalized * moveSpeed;
        }
        else
        {
            transform.position = Vector2.MoveTowards(transform.position, target, moveSpeed * Time.deltaTime);
        }
    }
}
