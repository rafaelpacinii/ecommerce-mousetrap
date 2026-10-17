package br.unitins.tp2.service;
import java.util.List;
import br.unitins.tp2.dto.*;
import br.unitins.tp2.repository.*;
import br.unitins.tp2.exception.ValidationException;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import org.eclipse.microprofile.jwt.JsonWebToken;
@ApplicationScoped @RolesAllowed({"customer","admin"})
public class DesejoServiceImpl implements DesejoService {
    @Inject DesejoRepository desejos;
    @Inject MouseRepository mouses;
    @Inject EntityManager em;
    @Inject JsonWebToken token;
    private String subject(){String s=token.getSubject();if(s==null||s.isBlank()||s.length()>255)throw new ForbiddenException();return s;}
    @Override public List<Long> ids(){return desejos.find("identidadeSubject = ?1 order by id desc",subject()).list().stream().map(d->d.getMouse().getId()).toList();}
    @Override public PageResponse<DesejoResponseDTO> listar(int page,int size){
        if(page<0||size<1||size>100)throw new BadRequestException("Paginação inválida.");
        var q=desejos.find("identidadeSubject = ?1 order by id desc",subject());
        long total=q.count();return PageResponse.of(q.page(page,size).list(),page,size,total,DesejoResponseDTO::valueOf);
    }
    @Override @Transactional public void adicionar(Long id){
        String s=subject();
        em.createNativeQuery("select pg_advisory_xact_lock(hashtextextended(:subject, 73))").setParameter("subject",s).getSingleResult();
        if(desejos.count("identidadeSubject = ?1 and mouse.id = ?2",s,id)>0)return;
        var m=mouses.findById(id,LockModeType.PESSIMISTIC_READ);
        if(m==null||!Boolean.TRUE.equals(m.getAtivo())||!Boolean.TRUE.equals(m.getMarca().getAtivo()))throw new NotFoundException("Produto indisponível.");
        if(desejos.count("identidadeSubject",s)>=500)throw new ValidationException("desejos","Sua lista pode ter até 500 produtos.");
        var d=new br.unitins.tp2.model.Desejo();d.setIdentidadeSubject(s);d.setMouse(m);desejos.persistAndFlush(d);
    }
    @Override @Transactional public void remover(Long id){desejos.delete("identidadeSubject = ?1 and mouse.id = ?2",subject(),id);}
}
